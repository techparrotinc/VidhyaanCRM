'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ClassModeForm from './components/ClassModeForm'
import StudentModeForm from './components/StudentModeForm'
import PreviewPage from './components/PreviewPage'

export default function FeeManagementCreatePage() {
  const router = useRouter()
  
  // Modes: 'class' (Class Mode) or 'student' (Student Mode)
  const [mode, setMode] = useState<'class' | 'student'>('class')
  const [showPreview, setShowPreview] = useState(false)

  // Preview page configuration payload
  const [previewPayload, setPreviewPayload] = useState<any>(null)

  const handleClassSubmit = (data: any) => {
    setPreviewPayload({
      mode: 'class',
      grade: data.grade,
      invoiceType: data.invoiceType,
      selectedTerms: data.selectedTerms,
      selectedPlanId: data.selectedPlanId,
      initialItems: data.items
    })
    setShowPreview(true)
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
    setShowPreview(true)
  }

  const handleModeChange = (newMode: 'class' | 'student') => {
    setMode(newMode)
    // Switching modes resets all payload state to avoid stale data leaking
    setPreviewPayload(null)
  }

  if (showPreview && previewPayload) {
    return (
      <PreviewPage
        mode={previewPayload.mode}
        grade={previewPayload.grade}
        student={previewPayload.student}
        invoiceType={previewPayload.invoiceType}
        selectedTerms={previewPayload.selectedTerms}
        selectedPlanId={previewPayload.selectedPlanId}
        initialItems={previewPayload.initialItems}
        onBack={() => setShowPreview(false)}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/fee-management')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors"
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
      </div>

      {/* ── CONTENT BODY ── */}
      <div className="px-4 sm:px-6 py-6 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          
          {/* Mode Toggle */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide select-none">
              Create Invoice For:
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('class')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-colors select-none cursor-pointer ${
                  mode === 'class'
                    ? 'bg-[#1565D8] text-white border-[#1565D8]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                A Class
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('student')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-colors select-none cursor-pointer ${
                  mode === 'student'
                    ? 'bg-[#1565D8] text-white border-[#1565D8]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                A Student
              </button>
            </div>
          </div>

          {/* Form Area */}
          <div className="transition-all duration-200">
            {mode === 'class' ? (
              <ClassModeForm onSubmit={handleClassSubmit} />
            ) : (
              <StudentModeForm onSubmit={handleStudentSubmit} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
