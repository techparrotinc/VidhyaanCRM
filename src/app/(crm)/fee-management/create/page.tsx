'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ClassModeForm, { type WizardFormHandle } from './components/ClassModeForm'
import StudentModeForm from './components/StudentModeForm'
import PreviewStep from './components/PreviewStep'
import Stepper from './components/Stepper'
import SegmentedControl from './components/SegmentedControl'

export default function FeeManagementCreatePage() {
  const router = useRouter()

  // Modes: 'class' (Class Mode) or 'student' (Student Mode)
  const [mode, setMode] = useState<'class' | 'student'>('class')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isStepValid, setIsStepValid] = useState(false)

  // Preview step configuration payload
  const [previewPayload, setPreviewPayload] = useState<any>(null)

  const formRef = useRef<WizardFormHandle>(null)

  const handleClassSubmit = (data: any) => {
    setPreviewPayload({
      mode: 'class',
      grade: data.grade,
      selectedGradeLabel: data.selectedGradeLabel,
      invoiceType: data.invoiceType,
      selectedTerms: data.selectedTerms,
      selectedPlanId: data.selectedPlanId,
      initialItems: data.items
    })
    setStep(3)
  }

  const handleStudentSubmit = (data: any) => {
    setPreviewPayload({
      mode: 'student',
      student: data.student,
      invoiceType: data.invoiceType,
      selectedTerms: data.selectedTerms,
      selectedPlanId: data.selectedPlanId,
      initialItems: data.items
    })
    setStep(3)
  }

  const handleModeChange = (newMode: 'class' | 'student') => {
    setMode(newMode)
    // Switching modes resets all payload state to avoid stale data leaking
    setPreviewPayload(null)
    setStep(1)
    setIsStepValid(false)
  }

  const handleValidityChange = useCallback((valid: boolean) => {
    setIsStepValid(valid)
  }, [])

  const handleBack = () => {
    if (step === 1) {
      router.push('/fee-management')
    } else if (step === 3) {
      // Leaving the preview discards per-term edits (matches the old
      // unmount-on-back semantics of the full-screen preview).
      setPreviewPayload(null)
      setStep(2)
    } else {
      setStep(1)
    }
  }

  const handleNext = () => {
    if (!isStepValid) return
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      // Builds the preview payload via the form's onSubmit handler
      formRef.current?.submit()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans">
      {/* ── HEADER ── */}
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Create Invoice
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 select-none">
                Generate new invoices for class batches or individual students
              </p>
            </div>
          </div>
          <Stepper currentStep={step} />
        </div>
      </div>

      {/* ── CONTENT BODY ── */}
      {step === 3 && previewPayload && (
        <div className="flex-1 flex flex-col pt-4">
          <PreviewStep
            mode={previewPayload.mode}
            grade={previewPayload.grade}
            selectedGradeLabel={previewPayload.selectedGradeLabel}
            student={previewPayload.student}
            invoiceType={previewPayload.invoiceType}
            selectedTerms={previewPayload.selectedTerms}
            selectedPlanId={previewPayload.selectedPlanId}
            initialItems={previewPayload.initialItems}
            onBack={handleBack}
          />
        </div>
      )}

      {/* Steps 1–2 stay mounted (hidden during preview) so Back keeps form state */}
      <div className={step === 3 ? 'hidden' : 'contents'}>
          <div className="px-4 sm:px-6 py-6 flex-1">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              {/* Mode Toggle (step 1 only) */}
              {step === 1 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide select-none">
                    Create Invoice For:
                  </h2>
                  <SegmentedControl
                    options={[
                      { value: 'class', label: 'A Class' },
                      { value: 'student', label: 'A Student' }
                    ]}
                    value={mode}
                    onChange={handleModeChange}
                  />
                </div>
              )}

              {/* Form Area — stays mounted across steps 1–2 so state survives */}
              <div className="transition-all duration-200">
                {mode === 'class' ? (
                  <ClassModeForm
                    ref={formRef}
                    step={step === 2 ? 2 : 1}
                    onValidityChange={handleValidityChange}
                    onSubmit={handleClassSubmit}
                  />
                ) : (
                  <StudentModeForm
                    ref={formRef}
                    step={step === 2 ? 2 : 1}
                    onValidityChange={handleValidityChange}
                    onSubmit={handleStudentSubmit}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── WIZARD FOOTER (steps 1–2) ── */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 shadow-lg z-10">
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3 select-none">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl shadow transition duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {step === 1 ? 'Next: Fee Items' : 'Next: Preview & Schedule'}
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}
