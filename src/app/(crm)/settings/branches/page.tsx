"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Plus,
  Loader2,
  CheckCircle2,
  X,
  MapPin,
  Phone,
  Mail,
  Star,
  Pencil,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useSession } from 'next-auth/react'

interface Branch {
  id: string
  name: string
  code: string | null
  isDefault: boolean
  addressLine: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  email: string | null
}

const emptyForm = {
  name: '',
  code: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: ''
}

export default function BranchesSettingsPage() {
  const { data: session } = useSession()
  const confirm = useConfirm()
  const isOrgAdmin = session?.user?.role === 'ORG_ADMIN'

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/branches')
      if (!res.ok) throw new Error('Failed to fetch branches')
      const json = await res.json()
      setBranches(json.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Error loading branches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const triggerToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 4000)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (branch: Branch) => {
    setEditingId(branch.id)
    setForm({
      name: branch.name,
      code: branch.code ?? '',
      addressLine: branch.addressLine ?? '',
      city: branch.city ?? '',
      state: branch.state ?? '',
      pincode: branch.pincode ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        addressLine: form.addressLine.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null
      }
      const res = await fetch(
        editingId ? `/api/v1/branches/${editingId}` : '/api/v1/branches',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message || body?.message || 'Failed to save branch')
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      triggerToast(editingId ? 'Branch updated' : 'Branch created')
      fetchBranches()
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (branch: Branch) => {
    const res = await fetch(`/api/v1/branches/${branch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true })
    })
    if (res.ok) {
      triggerToast(`${branch.name} is now the default branch`)
      fetchBranches()
    }
  }

  const handleDeactivate = async (branch: Branch) => {
    const okToDelete = await confirm({
      title: 'Deactivate branch?',
      message: `"${branch.name}" will be hidden from switchers and reports. Existing records keep their branch tag.`,
      confirmLabel: 'Deactivate',
      variant: 'danger'
    })
    if (!okToDelete) return
    const res = await fetch(`/api/v1/branches/${branch.id}`, { method: 'DELETE' })
    if (res.ok) {
      triggerToast('Branch deactivated')
      fetchBranches()
    } else {
      const body = await res.json().catch(() => null)
      setError(body?.error?.message || body?.message || 'Failed to deactivate branch')
      setTimeout(() => setError(null), 5000)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Branches</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
            Campuses under your organization. Records, fees and reports can be scoped per branch.
          </p>
        </div>
        {isOrgAdmin && (
          <Button onClick={openCreate} className="text-sm font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Branch
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700 flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            No branches yet. Add your first branch to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5 text-[#1565D8]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      {branch.name}
                      {branch.code && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                          {branch.code}
                        </span>
                      )}
                    </p>
                    {branch.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Default branch
                      </span>
                    )}
                  </div>
                </div>
                {isOrgAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(branch)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                      title="Edit branch"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!branch.isDefault && (
                      <button
                        onClick={() => handleDeactivate(branch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Deactivate branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {(branch.addressLine || branch.city) && (
                  <p className="text-xs font-normal text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {[branch.addressLine, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                {branch.phone && (
                  <p className="text-xs font-normal text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {branch.phone}
                  </p>
                )}
                {branch.email && (
                  <p className="text-xs font-normal text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {branch.email}
                  </p>
                )}
              </div>

              {isOrgAdmin && !branch.isDefault && (
                <button
                  onClick={() => handleSetDefault(branch)}
                  className="self-start text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer"
                >
                  Make default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {editingId ? 'Edit Branch' : 'Add Branch'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Branch Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Whitefield Campus"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Branch Code</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WF"
                    maxLength={20}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Address</label>
                  <input
                    value={form.addressLine}
                    onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">State</label>
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Pincode</label>
                  <input
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-sm font-semibold">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !form.name.trim()} className="text-sm font-semibold">
                  {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Branch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toast.message}
        </div>
      )}
    </div>
  )
}
