'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  MoreVertical,
  UserPlus,
  CheckCircle2,
  X,
  Trash2,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  name: string
  role: string
  phone: string | null
  email: string
  status: string
  createdAt: string
  lastLoginAt: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tabs state: 'ACTIVE' | 'INVITED' | 'DEACTIVATED'
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INVITED' | 'DEACTIVATED'>('ACTIVE')

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleEditModal, setShowRoleEditModal] = useState<User | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Invite Form State
  const [inviteName, setInviteName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('COUNSELLOR')
  const [inviting, setInviting] = useState(false)

  // Edit Role Form State
  const [editRoleValue, setEditRoleValue] = useState('')
  const [editingRole, setEditingRole] = useState(false)

  // Toast notifier state
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const json = await res.json()
      setUsers(json.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Error loading users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()

    // Close dropdowns on clicking outside
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Redirect if wrong role (only ORG_ADMIN and BRANCH_ADMIN allowed)
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role) {
      const role = session.user.role
      if (role !== 'ORG_ADMIN' && role !== 'BRANCH_ADMIN') {
        router.push('/dashboard')
      }
    }
  }, [session, authStatus, router])

  const triggerToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 4000)
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !invitePhone.trim() || !inviteEmail.trim()) return

    setInviting(true)
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          phone: invitePhone,
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Failed to invite user')
      }

      triggerToast(`Invitation sent to ${inviteName}`)
      setInviteName('')
      setInvitePhone('')
      setInviteEmail('')
      setInviteRole('COUNSELLOR')
      setShowInviteModal(false)
      await fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Could not invite user')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showRoleEditModal || !editRoleValue) return

    setEditingRole(true)
    try {
      const res = await fetch(`/api/v1/users/${showRoleEditModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRoleValue })
      })

      if (!res.ok) throw new Error('Failed to update user role')

      triggerToast(`Role updated for ${showRoleEditModal.name}`)
      setShowRoleEditModal(null)
      await fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Could not update user role')
    } finally {
      setEditingRole(false)
    }
  }

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return

    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Failed to deactivate user')
      }

      triggerToast(`${name} has been deactivated`)
      await fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Could not deactivate user')
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'COUNSELLOR':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'RECEPTIONIST':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'BRANCH_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  // Filter users based on active tab
  const filteredUsers = users.filter((u) => {
    if (activeTab === 'ACTIVE') return u.status === 'ACTIVE'
    if (activeTab === 'INVITED') return u.status === 'INVITED'
    return u.status === 'DEACTIVATED' || u.status === 'INACTIVE'
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 space-y-6 select-none">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team Members</h1>
          <p className="text-xs text-slate-400 mt-1 font-normal leading-normal">
            Manage roles, workspace access, and view activity of team members.
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shrink-0 rounded-lg text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 gap-6">
        {(['ACTIVE', 'INVITED', 'DEACTIVATED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === tab
                ? 'border-[#1565D8] text-[#1565D8] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'DEACTIVATED' ? 'Deactivated' : tab === 'ACTIVE' ? 'Active' : 'Invited'}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Phone</th>
                <th className="py-3 px-6">Last Login</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const initials = u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <tr key={u.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1565D8] font-black flex items-center justify-center text-xs border border-blue-100 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getRoleBadgeStyle(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{u.phone || '—'}</td>
                    <td className="py-4 px-6 text-slate-500 font-normal text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuId(activeMenuId === u.id ? null : u.id)
                        }}
                        className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === u.id && (
                        <div className="absolute right-6 top-10 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-44 z-40 text-left">
                          <button
                            onClick={() => {
                              setEditRoleValue(u.role)
                              setShowRoleEditModal(u)
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            Edit Role
                          </button>
                          {u.status !== 'DEACTIVATED' && u.status !== 'INACTIVE' && (
                            <button
                              onClick={() => handleDeactivate(u.id, u.name)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Deactivate Member
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                    No team members in this tab list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-sm">Invite Team Member</span>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@vidhyaan.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]"
                >
                  <option value="COUNSELLOR">Counsellor</option>
                  <option value="BRANCH_ADMIN">Branch Admin</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 border border-slate-200 h-auto rounded-lg shadow-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviting}
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-4 py-2 h-auto rounded-lg"
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {showRoleEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-sm">Update User Role</span>
              <button
                onClick={() => setShowRoleEditModal(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateRole} className="p-6 space-y-4 text-left">
              <p className="text-xs text-slate-500 font-medium">
                Changing role permissions will immediately affect workspace access parameters for **{showRoleEditModal.name}**.
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Role</label>
                <select
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                >
                  <option value="ORG_ADMIN">Org Admin</option>
                  <option value="BRANCH_ADMIN">Branch Admin</option>
                  <option value="COUNSELLOR">Counsellor</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => setShowRoleEditModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 border border-slate-200 h-auto rounded-lg shadow-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editingRole}
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-4 py-2 h-auto rounded-lg"
                >
                  {editingRole ? 'Saving...' : 'Update Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
