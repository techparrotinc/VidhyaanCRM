"use client"

import React, { useState, useEffect } from 'react'
import {
  MoreVertical,
  UserPlus,
  Loader2,
  CheckCircle2,
  X,
  UserCog,
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

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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

  const triggerToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 4000)
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !invitePhone.trim()) return

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

  const getStatusBadgeStyle = (status: string) => {
    // Map DB status DEACTIVATED to INACTIVE color styling
    if (status === 'ACTIVE') {
      return 'bg-green-100 text-green-800'
    } else if (status === 'INVITED') {
      return 'bg-amber-100 text-amber-800'
    } else {
      return 'bg-slate-100 text-slate-600'
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'DEACTIVATED') return 'INACTIVE'
    return status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
        <Button onClick={fetchUsers} className="mt-4 bg-[#1565D8] text-white">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-950">User Management</h3>
          <p className="text-sm text-slate-500">Manage institution roles, invite team members, and check workspace access.</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shrink-0 rounded-lg text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      <div className="border-t border-slate-200 pt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="pb-3 pl-2">Name</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 pr-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-4 pl-2 font-medium text-slate-800">
                  <div>{userItem.name}</div>
                  <div className="text-xs text-slate-400 font-normal mt-0.5">{userItem.email}</div>
                </td>
                <td className="py-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getRoleBadgeStyle(userItem.role)}`}>
                    {userItem.role}
                  </span>
                </td>
                <td className="py-4 text-slate-600 font-medium">{userItem.phone ?? '—'}</td>
                <td className="py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyle(userItem.status)}`}>
                    {getStatusLabel(userItem.status)}
                  </span>
                </td>
                <td className="py-4 pr-2 text-right relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMenuId(activeMenuId === userItem.id ? null : userItem.id)
                    }}
                    className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Action Menu */}
                  {activeMenuId === userItem.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-left text-xs font-semibold animate-fade-in">
                      <button
                        onClick={() => {
                          setShowRoleEditModal(userItem)
                          setEditRoleValue(userItem.role)
                        }}
                        className="w-full px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleDeactivate(userItem.id, userItem.name)}
                        className="w-full px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Deactivate
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-base font-bold text-slate-900 mb-1">Invite Team Member</h4>
            <p className="text-xs text-slate-400 mb-5">Invited members receive an SMS/WhatsApp invite containing details.</p>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Saran Kumar"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#1565D8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="10 digit Indian number"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#1565D8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. mail@example.com"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#1565D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  System Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#1565D8]"
                >
                  <option value="COUNSELLOR">COUNSELLOR</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <Button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviting || !inviteName.trim() || !invitePhone.trim()}
                  className="bg-[#1565D8] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Invite Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showRoleEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowRoleEditModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-base font-bold text-slate-900 mb-1">Edit User Role</h4>
            <p className="text-xs text-slate-400 mb-5">Change access levels for {showRoleEditModal.name}.</p>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select New Role
                </label>
                <select
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#1565D8]"
                >
                  <option value="COUNSELLOR">COUNSELLOR</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="TEACHER">TEACHER</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <Button
                  type="button"
                  onClick={() => setShowRoleEditModal(null)}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editingRole || !editRoleValue}
                  className="bg-[#1565D8] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingRole ? 'Saving...' : 'Save Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
