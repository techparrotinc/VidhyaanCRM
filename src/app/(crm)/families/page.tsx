'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Search, Phone, Mail, ChevronDown, ChevronRight, UserPlus, GraduationCap, ClipboardList } from 'lucide-react'

interface Member { id: string; code: string; name: string; grade: string | null; status: string }
interface Family {
  id: string
  primaryName: string | null
  primaryEmail: string | null
  phoneNormalized: string
  memberCount: number
  childCount: number
  leads: { id: string; leadCode: string; kidName: string | null; gradeSought: string | null; status: string }[]
  admissions: { id: string; admissionCode: string; applicantName: string | null; gradeSought: string | null; status: string }[]
  students: { id: string; studentCode: string; name: string; gradeLabel: string | null; status: string }[]
}

const statusPill = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500'

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const fetchFamilies = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/families${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      const data = await res.json()
      setFamilies(data.data?.families ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchFamilies(search), 250)
    return () => clearTimeout(t)
  }, [search, fetchFamilies])

  return (
    <div className="max-w-5xl mx-auto p-5 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#1565D8]" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Families</h1>
            <p className="text-sm text-slate-500 mt-1">Guardians grouped by phone — every child across leads, admissions and students.</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or phone…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : families.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">No families yet. They appear as leads, admissions and students are added.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {families.map(f => {
            const isOpen = !!open[f.id]
            return (
              <div key={f.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpen(o => ({ ...o, [f.id]: !o[f.id] }))}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                    {(f.primaryName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{f.primaryName || 'Unnamed guardian'}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Phone size={11} /> {f.phoneNormalized}</span>
                      {f.primaryEmail && <span className="inline-flex items-center gap-1 truncate"><Mail size={11} /> {f.primaryEmail}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      {f.childCount} child{f.childCount === 1 ? '' : 'ren'} · {f.memberCount} record{f.memberCount === 1 ? '' : 's'}
                    </span>
                    {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 space-y-4 bg-slate-50/50">
                    <MemberGroup
                      icon={UserPlus} label="Leads" tint="text-blue-600"
                      members={f.leads.map(l => ({ id: l.id, code: l.leadCode, name: l.kidName || '—', grade: l.gradeSought, status: l.status }))}
                      href="/lead-management"
                    />
                    <MemberGroup
                      icon={ClipboardList} label="Admissions" tint="text-violet-600"
                      members={f.admissions.map(a => ({ id: a.id, code: a.admissionCode, name: a.applicantName || '—', grade: a.gradeSought, status: a.status }))}
                      href="/admission-management"
                    />
                    <MemberGroup
                      icon={GraduationCap} label="Students" tint="text-emerald-600"
                      members={f.students.map(s => ({ id: s.id, code: s.studentCode, name: s.name, grade: s.gradeLabel, status: s.status }))}
                      href="/student-management"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MemberGroup({ icon: Icon, label, tint, members, href }: {
  icon: React.ComponentType<any>; label: string; tint: string; members: Member[]; href: string
}) {
  if (members.length === 0) return null
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${tint}`}>
        <Icon size={13} strokeWidth={2} /> {label} ({members.length})
      </p>
      <div className="space-y-1.5">
        {members.map(m => (
          <Link key={m.id} href={`${href}/${m.id}`} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-blue-200 transition">
            <span className="text-sm font-semibold text-slate-800 truncate flex-1">{m.name}</span>
            {m.grade && <span className="text-xs text-slate-500 shrink-0">{m.grade}</span>}
            <span className={statusPill}>{m.status.replace(/_/g, ' ').toLowerCase()}</span>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">{m.code}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
