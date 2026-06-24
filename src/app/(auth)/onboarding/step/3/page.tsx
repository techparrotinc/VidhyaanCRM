'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react'

const boardsList = ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'IGCSE', 'Other']

const facilitiesList = [
  { id: 'Library', label: '📚 Library' },
  { id: 'Sports Ground', label: '🏃 Sports Ground' },
  { id: 'Science Lab', label: '🔬 Science Lab' },
  { id: 'Computer Lab', label: '💻 Computer Lab' },
  { id: 'Transport', label: '🚌 Transport' },
  { id: 'Cafeteria', label: '🍽 Cafeteria / Canteen' },
  { id: 'Medical Room', label: '🏥 Medical Room' },
  { id: 'Auditorium', label: '🎭 Auditorium' },
  { id: 'Swimming Pool', label: '🏊 Swimming Pool' },
  { id: 'Music Room', label: '🎵 Music Room' },
  { id: 'Art Room', label: '🎨 Art Room' },
  { id: 'CCTV Security', label: '📷 CCTV Security' },
  { id: 'Special Needs', label: '♿ Special Needs Support' },
  { id: 'Smart Classrooms', label: '🌐 Smart Classrooms' }
]

interface FeeRow {
  gradeLabel: string
  minAmount: string
  maxAmount: string
}

export default function OnboardingStep3() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Institution Type flag (default school)
  const [isLC, setIsLC] = useState(false)

  // Form Fields
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [affiliationNo, setAffiliationNo] = useState('')
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  
  // School Fees State
  const [feeRows, setFeeRows] = useState<FeeRow[]>([
    { gradeLabel: 'Class 1', minAmount: '30000', maxAmount: '50000' }
  ])
  
  // Learning Center Fees State
  const [monthlyFeeMin, setMonthlyFeeMin] = useState('')
  const [monthlyFeeMax, setMonthlyFeeMax] = useState('')
  const [activityTypes, setActivityTypes] = useState('')
  
  // Admissions status
  const [admissionOpen, setAdmissionOpen] = useState(true)
  const [academicYear, setAcademicYear] = useState('2026-27')

  useEffect(() => {
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          const s = data.school
          setIsLC(s.institutionType === 'LEARNING_CENTER' || s.institutionType === 'COACHING_CENTER')
          
          if (s.affiliations) {
            setSelectedBoards(s.affiliations.map((a: any) => a.board))
            const aff = s.affiliations.find((a: any) => a.affiliationNo)
            if (aff) setAffiliationNo(aff.affiliationNo)
          }

          if (s.facilities) {
            setSelectedFacilities(s.facilities.map((f: any) => f.name))
          }

          if (s.feeRanges && s.feeRanges.length > 0) {
            setFeeRows(s.feeRanges.map((fr: any) => ({
              gradeLabel: fr.gradeLabel,
              minAmount: Math.round(fr.minAmount).toString(),
              maxAmount: Math.round(fr.maxAmount).toString()
            })))
          }

          setMonthlyFeeMin(s.monthlyFeeMin ? s.monthlyFeeMin.toString() : '')
          setMonthlyFeeMax(s.monthlyFeeMax ? s.monthlyFeeMax.toString() : '')
          if (s.activityTypes) {
            setActivityTypes(s.activityTypes.join(', '))
          }
          setAdmissionOpen(s.admissionOpen ?? true)
        }
      })
      .catch((err) => console.error('Error prefilling step 3:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleBoardToggle = (board: string) => {
    setSelectedBoards((prev) =>
      prev.includes(board) ? prev.filter((b) => b !== board) : [...prev, board]
    )
  }

  const handleFacilityToggle = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    )
  }

  const handleAddFeeRow = () => {
    setFeeRows((prev) => [...prev, { gradeLabel: '', minAmount: '', maxAmount: '' }])
  }

  const handleRemoveFeeRow = (index: number) => {
    setFeeRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFeeRowChange = (index: number, field: keyof FeeRow, value: string) => {
    setFeeRows((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (selectedBoards.length === 0 && !isLC) {
      setError('Please select at least one curriculum board')
      return
    }

    setSaving(true)

    try {
      const payload: any = {
        boards: selectedBoards,
        affiliationNo,
        facilities: selectedFacilities,
        admissionOpen,
        academicYear
      }

      if (isLC) {
        payload.monthlyFeeMin = monthlyFeeMin ? parseInt(monthlyFeeMin) : null
        payload.monthlyFeeMax = monthlyFeeMax ? parseInt(monthlyFeeMax) : null
        payload.activityTypes = activityTypes ? activityTypes.split(',').map(s => s.trim()).filter(Boolean) : []
      } else {
        // Filter out empty rows
        payload.feeRanges = feeRows
          .filter(r => r.gradeLabel && r.minAmount && r.maxAmount)
          .map(r => ({
            gradeLabel: r.gradeLabel,
            minAmount: parseFloat(r.minAmount),
            maxAmount: parseFloat(r.maxAmount)
          }))
      }

      const res = await fetch('/api/v1/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          data: payload
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save academics details')
      }

      router.push('/onboarding/step/4')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/step/4')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 flex-1">
        <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Loading academic details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800">Academic Details</h2>
          <p className="text-sm text-slate-500">Help parents understand your curriculum and facilities</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form id="step-3-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION: BOARD & AFFILIATION (Only for Schools) */}
          {!isLC && (
            <div className="space-y-4 bg-slate-50/50 rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Board & Affiliation
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Curriculum / Boards <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3 pt-1">
                  {boardsList.map((b) => (
                    <label
                      key={b}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                        selectedBoards.includes(b)
                          ? 'bg-[#1565D8] text-white border-[#1565D8]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBoards.includes(b)}
                        onChange={() => handleBoardToggle(b)}
                        className="hidden"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Affiliation Number
                </label>
                <input
                  type="text"
                  value={affiliationNo}
                  onChange={(e) => setAffiliationNo(e.target.value)}
                  placeholder="As per your board certificate"
                  className="w-full max-w-[320px] px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-xs"
                />
              </div>
            </div>
          )}

          {/* SECTION: FACILITIES */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Available Facilities
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Check all facilities that apply to your campus</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
              {facilitiesList.map((f) => (
                <label
                  key={f.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${
                    selectedFacilities.includes(f.id)
                      ? 'bg-blue-50/40 text-[#1565D8] border-[#1565D8] font-bold'
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFacilities.includes(f.id)}
                    onChange={() => handleFacilityToggle(f.id)}
                    className="w-4 h-4 text-[#1565D8] border-slate-300 focus:ring-[#1565D8] rounded"
                  />
                  <span className="text-xs">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SECTION: FEE RANGE */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            {isLC ? (
              /* Learning Center Fee inputs */
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Monthly Fee Range & Activities
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Approximate monthly budget filters</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Min Monthly Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyFeeMin}
                      onChange={(e) => setMonthlyFeeMin(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Max Monthly Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyFeeMax}
                      onChange={(e) => setMonthlyFeeMax(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Activity / Batch Types
                  </label>
                  <input
                    type="text"
                    value={activityTypes}
                    onChange={(e) => setActivityTypes(e.target.value)}
                    placeholder="e.g. Art & Craft, Keyboard, Swimming, Robotics"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none text-xs"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Separate different activities with commas.
                  </span>
                </div>
              </div>
            ) : (
              /* Regular School Fee Table */
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Annual Fee Range <span className="text-slate-400 font-medium text-xs">(Optional)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Helps parents filter schools by tuition budget</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeeRow}
                    className="px-3 py-1.5 bg-blue-50 text-[#1565D8] hover:bg-[#1565D8] hover:text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Grade / Class</th>
                        <th className="px-4 py-2.5">Min Fee (₹)</th>
                        <th className="px-4 py-2.5">Max Fee (₹)</th>
                        <th className="px-4 py-2.5 text-center w-12">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 text-xs">
                            No fee ranges defined. Click "Add Row" to specify fees.
                          </td>
                        </tr>
                      ) : (
                        feeRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.gradeLabel}
                                onChange={(e) => handleFeeRowChange(idx, 'gradeLabel', e.target.value)}
                                placeholder="e.g. Class 1 or UKG"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={row.minAmount}
                                onChange={(e) => handleFeeRowChange(idx, 'minAmount', e.target.value)}
                                placeholder="e.g. 25000"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={row.maxAmount}
                                onChange={(e) => handleFeeRowChange(idx, 'maxAmount', e.target.value)}
                                placeholder="e.g. 45000"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFeeRow(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: ADMISSION STATUS */}
          <div className="space-y-4 border-t border-slate-100 pt-5 mt-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Admission Status
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 text-xs sm:text-sm block">Accepting Admissions</span>
                <span className="text-slate-400 text-[11px] block">
                  Show an "Admissions Open" badge on your public listing page.
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  admissionOpen ? 'text-[#1565D8]' : 'text-slate-400'
                }`}>
                  {admissionOpen ? 'ON' : 'OFF'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={admissionOpen}
                    onChange={(e) => setAdmissionOpen(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1565D8]" />
                </label>
              </div>
            </div>

            <div className="space-y-1.5 max-w-[280px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Currently Admitting For
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026-27"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-xs"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Nav Bar */}
      <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
        <button
          onClick={() => router.push('/onboarding/step/2')}
          type="button"
          className="px-5 py-2.5 text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer select-none"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            type="button"
            className="text-xs font-bold text-slate-400 hover:text-[#1565D8] transition-colors cursor-pointer select-none px-3"
          >
            Skip for now
          </button>
          
          <button
            type="submit"
            form="step-3-form"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save & Continue</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
