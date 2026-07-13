'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Award, ChevronDown, GraduationCap, Loader2, TrendingUp } from 'lucide-react'

type SubjectRow = {
  subject: string
  marksObtained: number
  maxMarks: number
  grade: string | null
  remarks: string | null
}
type Exam = {
  examName: string
  examDate: string | null
  total: number
  max: number
  percentage: number | null
  subjects: SubjectRow[]
}
type StudentResults = {
  id: string
  name: string
  gradeLabel: string | null
  section: string | null
  orgName: string
  exams: Exam[]
}

function gradeColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 75) return 'text-[#1565D8]'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function barColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-400'
  if (pct >= 75) return 'bg-[#1565D8]'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-red-400'
}

export default function ParentResultsPage() {
  const [students, setStudents] = useState<StudentResults[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [openExam, setOpenExam] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/parent/results')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStudents(json.data.students)
          const first = json.data.students[0]
          if (first) {
            setActiveId(first.id)
            setOpenExam(first.exams[0]?.examName ?? null)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const active = useMemo(() => students.find((s) => s.id === activeId) ?? null, [students, activeId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  const hasAny = students.some((s) => s.exams.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-slate-900">Report Card</h1>
        <p className="text-sm font-semibold text-slate-400 mt-0.5">
          Exam results and progress, straight from the school
        </p>
      </div>

      {students.length === 0 || !hasAny ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-sm font-black text-slate-700">No results yet</h2>
          <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm mx-auto">
            Exam marks appear here once your child&apos;s school publishes them.
          </p>
        </div>
      ) : (
        <>
          {students.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id)
                    setOpenExam(s.exams[0]?.examName ?? null)
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    activeId === s.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {s.name.split(' ')[0]} · {s.gradeLabel ?? ''}
                </button>
              ))}
            </div>
          )}

          {active && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">
              {/* ===== LEFT: exams ===== */}
              <div className="lg:col-span-2 space-y-4">
                {active.exams.length === 0 && (
                  <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-10 text-center">
                    <p className="text-sm font-black text-slate-500">No results published for {active.name.split(' ')[0]} yet</p>
                  </div>
                )}
                {active.exams.map((exam) => {
                  const open = openExam === exam.examName
                  return (
                    <div key={exam.examName} className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setOpenExam(open ? null : exam.examName)}
                        className="w-full flex items-center justify-between gap-3 p-5 cursor-pointer hover:bg-slate-50/60 transition"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate">{exam.examName}</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {exam.examDate && new Date(exam.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {exam.examDate && ' · '}{exam.subjects.length} subjects
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className={`text-xl font-black tracking-tight ${exam.percentage !== null ? gradeColor(exam.percentage) : 'text-slate-500'}`}>
                              {exam.percentage !== null ? `${exam.percentage}%` : '—'}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400">{exam.total}/{exam.max}</p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {open && (
                        <div className="border-t border-slate-50 divide-y divide-slate-50">
                          {exam.subjects.map((sub) => {
                            const pct = sub.maxMarks > 0 ? (sub.marksObtained / sub.maxMarks) * 100 : 0
                            return (
                              <div key={sub.subject} className="px-5 py-3.5">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[13px] font-bold text-slate-700">
                                    {sub.subject}
                                    {sub.grade && (
                                      <span className="ml-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                                        {sub.grade}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[13px] font-black text-slate-800 shrink-0">
                                    {sub.marksObtained}<span className="text-slate-300 font-semibold">/{sub.maxMarks}</span>
                                  </p>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                  <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                                {sub.remarks && (
                                  <p className="text-[11px] font-semibold text-slate-400 mt-1.5">“{sub.remarks}”</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ===== RIGHT RAIL: overview ===== */}
              <div className="space-y-6">
                <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Latest exam</p>
                  {active.exams[0] ? (
                    <>
                      <p className="text-3xl font-black tracking-tight mt-1">
                        {active.exams[0].percentage !== null ? `${active.exams[0].percentage}%` : '—'}
                      </p>
                      <p className="text-xs text-slate-400 font-semibold mt-1 truncate">
                        {active.exams[0].examName} · {active.exams[0].total}/{active.exams[0].max}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-300 mt-1.5">No exams yet</p>
                  )}
                </div>

                {active.exams.length > 1 && (
                  <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Progress
                    </p>
                    <div className="space-y-2.5">
                      {[...active.exams].reverse().map((e) => (
                        <div key={e.examName}>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500 truncate pr-2">{e.examName}</span>
                            <span className={e.percentage !== null ? gradeColor(e.percentage) : 'text-slate-400'}>
                              {e.percentage !== null ? `${e.percentage}%` : '—'}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${e.percentage !== null ? barColor(e.percentage) : 'bg-slate-200'}`}
                              style={{ width: `${Math.min(100, e.percentage ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl bg-blue-50 border border-blue-100 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1565D8]">About grades</p>
                  <p className="text-[13px] font-semibold text-slate-600 leading-relaxed mt-2">
                    Marks and grades are entered by the school. Contact the class teacher for
                    re-evaluation requests.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
