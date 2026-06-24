'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Shield,
  Users,
  Check,
  ChevronRight,
  Lock
} from 'lucide-react'

interface RoleDetail {
  role: string
  name: string
  description: string
  permissions: string[]
  badgeColor: string
}

const ROLES_LIST: RoleDetail[] = [
  {
    role: 'ORG_ADMIN',
    name: 'Organization Admin',
    description: 'Owner/Top-level administrator of the organization. Full workspace ownership.',
    permissions: [
      'Full dashboard & analytics visibility',
      'Invite & manage team members & roles',
      'Enable/disable premium modules',
      'Manage subscription billing & plans',
      'Update public school profile & media',
      'Configure pipeline stages & academic years'
    ],
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    role: 'BRANCH_ADMIN',
    name: 'Branch Admin',
    description: 'Administrator scoped to a specific school branch/campus.',
    permissions: [
      'Branch dashboard & local analytics visibility',
      'Allot local leads to counsellors',
      'Manage students & attendance logs',
      'Log local fee collections & billing data',
      'Manage branch-specific configurations'
    ],
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    role: 'COUNSELLOR',
    name: 'Counsellor',
    description: 'Responsible for nurturing leads and converting them into admissions.',
    permissions: [
      'View & edit assigned leads',
      'Move leads across pipeline stages',
      'Log admission calls, notes & follow-ups',
      'Initiate student registration conversions'
    ],
    badgeColor: 'bg-green-50 text-green-700 border-green-200'
  },
  {
    role: 'RECEPTIONIST',
    name: 'Receptionist',
    description: 'Handles walk-in enquiries and quick front-office tasks.',
    permissions: [
      'Log new walk-in leads directly',
      'Check active appointment schedules',
      'Quick student directory query'
    ],
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    role: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Manages school finance, collections, and parent invoices.',
    permissions: [
      'Generate & publish student fee invoices',
      'Record offline cash/cheque fee collections',
      'Track overdue fees & trigger automated reminders',
      'View financial revenue reports & transactions'
    ],
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    role: 'TEACHER',
    name: 'Teacher',
    description: 'Handles classroom scheduling, grading, and attendance logging.',
    permissions: [
      'Log student attendance daily',
      'Post classroom notifications & homework',
      'Submit academic report parameters'
    ],
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  }
]

export default function RolesPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})

  // Fetch count of users per role from API
  useEffect(() => {
    fetch('/api/v1/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const counts: Record<string, number> = {}
          data.data.forEach((u: any) => {
            counts[u.role] = (counts[u.role] || 0) + 1
          })
          setRoleCounts(counts)
        }
      })
      .catch((e) => console.error('Failed to load role counts:', e))
  }, [])

  // Restrict to ORG_ADMIN only
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role) {
      if (session.user.role !== 'ORG_ADMIN') {
        router.push('/dashboard')
      }
    }
  }, [session, authStatus, router])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 space-y-8 select-none">
      {/* PAGE HEADER */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-1">
        <h1 className="text-xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-xs text-slate-400 font-normal leading-normal">
          Manage what each team member role can access. These permission structures are currently locked.
        </p>
      </div>

      {/* ROLE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLES_LIST.map((r) => {
          const count = roleCounts[r.role] || 0
          return (
            <div
              key={r.role}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between transition hover:shadow-md h-full"
            >
              <div className="space-y-4">
                {/* Badge + Name */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${r.badgeColor}`}>
                      {r.role}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight mt-1">{r.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    <span>{count}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  {r.description}
                </p>

                {/* Permissions list */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Permissions</span>
                  <ul className="space-y-1.5">
                    {r.permissions.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => router.push('/users')}
                  className="text-xs font-bold text-[#1565D8] hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
                >
                  <span>View Members</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* BOTTOM NOTICE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Enterprise Custom Roles</h4>
            <p className="text-xs text-slate-500 mt-1 font-normal leading-normal">
              Custom role permissions are available on the Enterprise plan.
            </p>
          </div>
        </div>
        <a
          href="mailto:support@vidhyaan.com"
          className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          Contact Sales
        </a>
      </div>
    </div>
  )
}
