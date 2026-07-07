'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import {
  ArrowLeft,
  ArrowRight,
  Users,
  GraduationCap,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  PartyPopper
} from 'lucide-react'
import { GRADE_OPTIONS } from '@/constants/grades'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { useConfirm } from '@/components/ui/confirm-dialog'

type MoveAction = 'PROMOTE' | 'RETAIN' | 'ALUMNI' | 'SKIP'

type StudentRow = {
  id: string
  studentCode: string
  name: string
  gradeLabel: string | null
  section: string | null
  rollNumber: string | null
  status: string
}

type FeeItem = { name: string; amount: number }

const GRADE_LABELS = GRADE_OPTIONS.map((g) => g.label)

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10'

export default function PromoteStudentsPage() {
  const router = useRouter()
  const confirmDialog = useConfirm()
  const { years } = useAcademicYears()

  const [step, setStep] = useState(1)

  // Step 1 — source selection
  const [sourceGrade, setSourceGrade] = useState('')
  const [sourceSection, setSourceSection] = useState('')
  const [actions, setActions] = useState<Record<string, MoveAction>>({})

  // Step 2 — destination
  const [targetYearId, setTargetYearId] = useState('')
  const [targetGrade, setTargetGrade] = useState('')
  const [targetSection, setTargetSection] = useState('')
  const [clearRollNumbers, setClearRollNumbers] = useState(true)

  // Step 3 — fees
  const [feeMode, setFeeMode] = useState<'plan' | 'skip'>('plan')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [feeItems, setFeeItems] = useState<FeeItem[]>([])
  const [dueDate, setDueDate] = useState('')

  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{
    moved: number
    invoiced: number
    invoiceError: string | null
    yearName: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Students in the source class
  const studentsKey = sourceGrade
    ? `/api/v1/students?limit=200&status=ACTIVE&gradeLabel=${encodeURIComponent(sourceGrade)}${sourceSection ? `&section=${encodeURIComponent(sourceSection)}` : ''}`
    : null
  const { data: studentsData, isLoading: studentsLoading } = useSWR(studentsKey, fetcher)
  const students: StudentRow[] = studentsData?.data ?? []

  // Fee plan templates
  const { data: plansData } = useSWR(step === 3 ? '/api/v1/fees/plans' : null, fetcher)
  const plans: any[] = plansData?.data ?? []

  const actionFor = (id: string): MoveAction => actions[id] ?? 'PROMOTE'
  const movingStudents = students.filter((s) => actionFor(s.id) !== 'SKIP')
  const invoiceStudents = students.filter((s) => ['PROMOTE', 'RETAIN'].includes(actionFor(s.id)))

  const setAllActions = (action: MoveAction) => {
    setActions(Object.fromEntries(students.map((s) => [s.id, action])))
  }

  const planHeads = useCallback((plan: any): FeeItem[] => {
    const raw = plan?.structure?.heads ?? plan?.structure ?? []
    if (!Array.isArray(raw)) return []
    return raw.map((h: any) => ({
      name: h.name ?? h.head ?? 'Fee',
      amount: Number(h.amount) || 0
    }))
  }, [])

  const choosePlan = (planId: string) => {
    setSelectedPlanId(planId)
    const plan = plans.find((p) => p.id === planId)
    setFeeItems(plan ? planHeads(plan) : [])
  }

  const feeTotal = feeItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  const canNextFrom1 = sourceGrade && students.length > 0 && movingStudents.length > 0
  const canNextFrom2 = targetYearId && (movingStudents.every((s) => actionFor(s.id) !== 'PROMOTE') || targetGrade)

  const handlePublish = async () => {
    const generatingInvoices = feeMode === 'plan' && invoiceStudents.length > 0 && feeItems.length > 0
    const yearName = years.find((y: any) => y.id === targetYearId)?.name ?? ''

    const okToPublish = await confirmDialog({
      title: `Move ${movingStudents.length} student${movingStudents.length > 1 ? 's' : ''}?`,
      message:
        `${movingStudents.filter((s) => actionFor(s.id) === 'PROMOTE').length} promoted to ${targetGrade}${targetSection ? `-${targetSection}` : ''}, ` +
        `${movingStudents.filter((s) => actionFor(s.id) === 'RETAIN').length} retained, ` +
        `${movingStudents.filter((s) => actionFor(s.id) === 'ALUMNI').length} marked alumni (${yearName}).` +
        (generatingInvoices
          ? `\n${invoiceStudents.length} invoice(s) of ₹${feeTotal.toLocaleString('en-IN')} each will be generated.`
          : '\nNo invoices will be generated.'),
      confirmLabel: 'Publish',
      variant: 'primary'
    })
    if (!okToPublish) return

    setIsPublishing(true)
    setError(null)
    try {
      // 1. Move students (single transaction server-side)
      const moveRes = await fetch('/api/v1/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAcademicYearId: targetYearId,
          moves: movingStudents.map((s) => ({
            studentId: s.id,
            action: actionFor(s.id),
            toGrade: actionFor(s.id) === 'PROMOTE' ? targetGrade : undefined,
            toSection: actionFor(s.id) === 'PROMOTE' ? targetSection || null : undefined,
            clearRollNumber: clearRollNumbers
          }))
        })
      })
      const moveJson = await moveRes.json()
      if (!moveRes.ok) throw new Error(moveJson.error || 'Failed to move students')

      // 2. Generate invoices (decoupled — a billing failure never rolls back the move)
      let invoiced = 0
      let invoiceError: string | null = null
      if (generatingInvoices) {
        try {
          const invRes = await fetch('/api/v1/fees/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'batch',
              invoices: invoiceStudents.map((s) => ({
                studentId: s.id,
                invoiceType: 'TERM',
                dueDate: dueDate || null,
                notes: `Year-end promotion — ${yearName}`,
                items: feeItems.map((i) => ({ name: i.name, quantity: 1, unitPrice: Number(i.amount) || 0 }))
              }))
            })
          })
          const invJson = await invRes.json()
          if (!invRes.ok) throw new Error(invJson.error || 'Invoice generation failed')
          invoiced = invJson.count ?? invoiceStudents.length
        } catch (e: any) {
          invoiceError = e.message || 'Invoice generation failed'
        }
      }

      setPublishResult({ moved: moveJson.data?.moved ?? movingStudents.length, invoiced, invoiceError, yearName })
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setIsPublishing(false)
    }
  }

  // ── Success screen ──
  if (publishResult) {
    return (
      <div className="mx-auto max-w-2xl p-6 lg:p-10">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <PartyPopper className="mx-auto h-10 w-10 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Movement complete</h1>
          <p className="mt-2 text-sm font-normal leading-relaxed text-slate-600">
            {publishResult.moved} student{publishResult.moved > 1 ? 's' : ''} moved for {publishResult.yearName}.
            {publishResult.invoiced > 0 && ` ${publishResult.invoiced} invoice(s) generated.`}
          </p>
          {publishResult.invoiceError && (
            <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Students were moved, but invoices failed: {publishResult.invoiceError}. Generate them from Fee Management.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push('/student-management')}
              className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold hover:bg-blue-700"
            >
              Back to Students
            </button>
            <button
              onClick={() => router.push('/fee-management')}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              View Invoices
            </button>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { n: 1, label: "Who's moving", icon: Users },
    { n: 2, label: 'Where to', icon: GraduationCap },
    { n: 3, label: 'Fees & publish', icon: IndianRupee }
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/student-management')}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Year-End Student Movement</h1>
          <p className="text-xs font-normal text-slate-400">
            Promote students to their next class, assign a fee plan and publish invoices in one go.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                step === s.n
                  ? 'bg-[#1565D8] text-white'
                  : step > s.n
                    ? 'bg-green-50 text-green-700'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {/* STEP 1 — SOURCE */}
      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Current Class</label>
              <select value={sourceGrade} onChange={(e) => { setSourceGrade(e.target.value); setActions({}) }} className={inputCls}>
                <option value="">Select class</option>
                {GRADE_LABELS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Section (optional)</label>
              <input
                value={sourceSection}
                onChange={(e) => setSourceSection(e.target.value.toUpperCase())}
                placeholder="e.g. A"
                maxLength={5}
                className={inputCls}
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => setAllActions('PROMOTE')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-[#1565D8] hover:bg-blue-100 cursor-pointer">All Promote</button>
              <button onClick={() => setAllActions('ALUMNI')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer">All Alumni</button>
              <button onClick={() => setAllActions('SKIP')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer">Skip All</button>
            </div>
          </div>

          {studentsLoading && <p className="text-sm text-slate-400">Loading students…</p>}
          {sourceGrade && !studentsLoading && students.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No active students in {sourceGrade}{sourceSection ? `-${sourceSection}` : ''}.
            </p>
          )}

          {students.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Roll No</th>
                    <th className="px-4 py-2.5">Section</th>
                    <th className="px-4 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-800">{s.name}</span>
                        <span className="ml-2 text-xs text-slate-400">{s.studentCode}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.section || '—'}</td>
                      <td className="px-4 py-2.5">
                        <select
                          value={actionFor(s.id)}
                          onChange={(e) => setActions((prev) => ({ ...prev, [s.id]: e.target.value as MoveAction }))}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] cursor-pointer"
                        >
                          <option value="PROMOTE">Promote</option>
                          <option value="RETAIN">Retain (same class)</option>
                          <option value="ALUMNI">Mark Alumni</option>
                          <option value="SKIP">Skip</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <span className="text-xs font-medium text-slate-400">
              {movingStudents.length} of {students.length} selected to move
            </span>
            <button
              disabled={!canNextFrom1}
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1565D8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — DESTINATION */}
      {step === 2 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Target Academic Year</label>
              <select value={targetYearId} onChange={(e) => setTargetYearId(e.target.value)} className={inputCls}>
                <option value="">Select year</option>
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.name}{y.status === 'ACTIVE' ? ' (active)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Promote to Class</label>
              <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className={inputCls}>
                <option value="">Select class</option>
                {GRADE_LABELS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Section</label>
              <input
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value.toUpperCase())}
                placeholder="e.g. B"
                maxLength={5}
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={clearRollNumbers}
              onChange={(e) => setClearRollNumbers(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#1565D8]"
            />
            Clear roll numbers (reassigned in the new class)
          </label>

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
            {movingStudents.filter((s) => actionFor(s.id) === 'PROMOTE').length} student(s):{' '}
            <strong>{sourceGrade}{sourceSection ? `-${sourceSection}` : ''}</strong> →{' '}
            <strong>{targetGrade || '?'}{targetSection ? `-${targetSection}` : ''}</strong>
            {movingStudents.some((s) => actionFor(s.id) === 'RETAIN') &&
              ` · ${movingStudents.filter((s) => actionFor(s.id) === 'RETAIN').length} retained`}
            {movingStudents.some((s) => actionFor(s.id) === 'ALUMNI') &&
              ` · ${movingStudents.filter((s) => actionFor(s.id) === 'ALUMNI').length} alumni`}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={!canNextFrom2}
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1565D8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — FEES & PUBLISH */}
      {step === 3 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="radio" checked={feeMode === 'plan'} onChange={() => setFeeMode('plan')} className="accent-[#1565D8]" />
              Assign fee plan & generate invoices
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="radio" checked={feeMode === 'skip'} onChange={() => setFeeMode('skip')} className="accent-[#1565D8]" />
              Move only — no invoices now
            </label>
          </div>

          {feeMode === 'plan' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Fee Plan</label>
                  <select value={selectedPlanId} onChange={(e) => choosePlan(e.target.value)} className={inputCls}>
                    <option value="">Select an existing plan (or add lines below)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.gradeLabel ? ` — ${p.gradeLabel}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputCls} cursor-pointer`} />
                </div>
              </div>

              {/* Editable line items */}
              <div className="rounded-lg border border-slate-100">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Invoice line items (editable)</span>
                  <button
                    onClick={() => setFeeItems((prev) => [...prev, { name: '', amount: 0 }])}
                    className="flex items-center gap-1 text-xs font-semibold text-[#1565D8] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add line
                  </button>
                </div>
                {feeItems.length === 0 ? (
                  <p className="p-4 text-sm text-slate-400">Pick a fee plan above or add line items manually.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {feeItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                        <input
                          value={item.name}
                          onChange={(e) => setFeeItems((prev) => prev.map((it, i) => (i === idx ? { ...it, name: e.target.value } : it)))}
                          placeholder="Fee head (e.g. Tuition Fee)"
                          className={`${inputCls} flex-1`}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={item.amount}
                            onChange={(e) => setFeeItems((prev) => prev.map((it, i) => (i === idx ? { ...it, amount: Number(e.target.value) } : it)))}
                            className={`${inputCls} w-32 text-right`}
                          />
                        </div>
                        <button
                          onClick={() => setFeeItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-300 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                      <span className="text-sm font-semibold text-slate-600">Total per student</span>
                      <span className="text-sm font-bold text-slate-900">₹{feeTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {invoiceStudents.length} invoice(s) of ₹{feeTotal.toLocaleString('en-IN')} will be generated (promoted + retained students; alumni excluded).
                  Edits here apply to this batch only — the saved fee plan is not changed.
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={isPublishing || (feeMode === 'plan' && feeItems.length > 0 && feeItems.some((i) => !i.name.trim()))}
              onClick={handlePublish}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 cursor-pointer"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isPublishing ? 'Publishing…' : 'Publish Movement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
