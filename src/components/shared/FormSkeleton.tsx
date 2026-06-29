import React from 'react'

export function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="w-48 h-6 bg-slate-200 rounded-md" />
        <div className="w-32 h-4 bg-slate-200 rounded-md mt-2" />
      </div>

      {/* Grid of fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Field 1 (Full Width) */}
        <div className="md:col-span-2 space-y-2">
          <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
          <div className="w-full h-10 bg-slate-200 rounded-lg" />
        </div>

        {/* Field 2 */}
        <div className="space-y-2">
          <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
          <div className="w-full h-10 bg-slate-200 rounded-lg" />
        </div>

        {/* Field 3 */}
        <div className="space-y-2">
          <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
          <div className="w-full h-10 bg-slate-200 rounded-lg" />
        </div>

        {/* Field 4 (Full Width) */}
        <div className="md:col-span-2 space-y-2">
          <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
          <div className="w-full h-10 bg-slate-200 rounded-lg" />
        </div>

        {/* Field 5 */}
        <div className="space-y-2">
          <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
          <div className="w-full h-10 bg-slate-200 rounded-lg" />
        </div>

        {/* Field 6 */}
        <div className="space-y-2">
          <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
          <div className="w-full h-10 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Footer / Submit Button */}
      <div className="flex justify-end pt-6 border-t border-slate-100">
        <div className="w-32 h-10 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )
}

export default FormSkeleton
