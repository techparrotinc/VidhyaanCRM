'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  X, 
  Baby, 
  Calendar, 
  Users,
  Settings
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Kid {
  id: string
  name: string
  dateOfBirth: string | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  gradeSought: string | null
}

interface ParentProfile {
  id: string
  name: string
  phone: string
  email: string | null
  city: string | null
  kids: Kid[]
}

const CITIES = [
  'Chennai',
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Kochi',
  'Coimbatore'
]

const GRADES = [
  'Playgroup',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12'
]

export default function ParentProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ParentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Personal Info Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    city: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Phone Change Flow State
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  // Kid Add/Edit Modal State
  const [kidModalOpen, setKidModalOpen] = useState(false)
  const [editingKid, setEditingKid] = useState<Kid | null>(null)
  const [kidFormData, setKidFormData] = useState({
    name: '',
    dob: '',
    gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '',
    grade: ''
  })
  const [kidError, setKidError] = useState<string | null>(null)
  const [kidSaving, setKidSaving] = useState(false)

  // Account Preferences (stored in localStorage or state)
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    whatsapp: true
  })
  const [privacy, setPrivacy] = useState({
    allowContact: true,
    showProfile: true
  })

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/parent/profile')
      if (!res.ok) throw new Error('Failed to retrieve profile')
      const json = await res.json()
      if (json.success && json.data) {
        setProfile(json.data)
        setFormData({
          name: json.data.name || '',
          email: json.data.email || '',
          city: json.data.city || 'Chennai'
        })
      } else {
        throw new Error(json.error || 'Failed to parse profile data')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error occurred while loading profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    // Retrieve settings if saved
    const savedNotifs = localStorage.getItem('parent_notifications')
    const savedPrivacy = localStorage.getItem('parent_privacy')
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)) } catch (e) {}
    }
    if (savedPrivacy) {
      try { setPrivacy(JSON.parse(savedPrivacy)) } catch (e) {}
    }
  }, [])

  // Save Settings to LocalStorage on Change
  const updateNotificationPref = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    localStorage.setItem('parent_notifications', JSON.stringify(updated))
    triggerToast('Notification preferences updated')
  }

  const updatePrivacyPref = (key: keyof typeof privacy) => {
    const updated = { ...privacy, [key]: !privacy[key] }
    setPrivacy(updated)
    localStorage.setItem('parent_privacy', JSON.stringify(updated))
    triggerToast('Privacy settings updated')
  }

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => {
      setSuccessMsg(prev => prev === msg ? null : prev)
    }, 3000)
  }

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Full Name must be at least 2 characters')
      return
    }

    try {
      setSavingProfile(true)
      setError(null)
      const res = await fetch('/api/v1/parent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          city: formData.city
        })
      })
      const json = await res.json()
      if (json.success) {
        setProfile(json.data)
        triggerToast('Profile information saved successfully')
      } else {
        throw new Error(json.error || 'Failed to save changes')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Phone Change Step 1 & 2
  const handlePhoneChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)

    if (!requiresVerification) {
      if (!/^[6-9]\d{9}$/.test(newPhone)) {
        setPhoneError('Please enter a valid 10-digit mobile number')
        return
      }

      try {
        setPhoneLoading(true)
        const res = await fetch('/api/v1/parent/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            city: formData.city,
            phone: newPhone
          })
        })
        const json = await res.json()
        if (res.status === 409) {
          setPhoneError('This phone number is already registered to another account')
          return
        }
        if (json.success) {
          if (json.requiresVerification) {
            setRequiresVerification(true)
          } else {
            // Already updated without verification (fallback or admin/mock mode)
            setProfile(json.data)
            setPhoneModalOpen(false)
            setNewPhone('')
            triggerToast('Phone number updated successfully')
          }
        } else {
          throw new Error(json.error || 'Failed to change phone')
        }
      } catch (err: any) {
        setPhoneError(err.message || 'Error sending OTP verification code')
      } finally {
        setPhoneLoading(false)
      }
    } else {
      if (!otpCode || otpCode.trim().length === 0) {
        setPhoneError('Please enter the OTP verification code')
        return
      }

      try {
        setPhoneLoading(true)
        const res = await fetch('/api/v1/parent/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            city: formData.city,
            phone: newPhone,
            code: otpCode.trim()
          })
        })
        const json = await res.json()
        if (json.success) {
          setProfile(json.data)
          setPhoneModalOpen(false)
          setNewPhone('')
          setOtpCode('')
          setRequiresVerification(false)
          triggerToast('Phone number updated successfully')
        } else {
          throw new Error(json.error || 'Invalid OTP code. Please try again.')
        }
      } catch (err: any) {
        setPhoneError(err.message || 'Verification failed')
      } finally {
        setPhoneLoading(false)
      }
    }
  }

  // Kid Add/Edit Forms Handler
  const handleOpenAddKid = () => {
    setEditingKid(null)
    setKidFormData({
      name: '',
      dob: '',
      gender: '',
      grade: ''
    })
    setKidError(null)
    setKidModalOpen(true)
  }

  const handleOpenEditKid = (kid: Kid) => {
    setEditingKid(kid)
    let formattedDob = ''
    if (kid.dateOfBirth) {
      formattedDob = kid.dateOfBirth.split('T')[0]
    }
    setKidFormData({
      name: kid.name,
      dob: formattedDob,
      gender: kid.gender || '',
      grade: kid.gradeSought || ''
    })
    setKidError(null)
    setKidModalOpen(true)
  }

  const handleKidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setKidError(null)

    if (!kidFormData.name || kidFormData.name.trim().length < 2) {
      setKidError('Child name must be at least 2 characters')
      return
    }

    try {
      setKidSaving(true)
      const url = editingKid 
        ? `/api/v1/parent/kids/${editingKid.id}` 
        : `/api/v1/parent/kids`
      const method = editingKid ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kidFormData.name.trim(),
          dob: kidFormData.dob || null,
          gender: kidFormData.gender || null,
          grade: kidFormData.grade || null
        })
      })

      const json = await res.json()
      if (json.success) {
        setKidModalOpen(false)
        fetchProfile()
        triggerToast(editingKid ? 'Child profile updated successfully' : 'Child profile added successfully')
      } else {
        throw new Error(json.error || 'Failed to save child profile')
      }
    } catch (err: any) {
      setKidError(err.message || 'Failed to submit profile')
    } finally {
      setKidSaving(false)
    }
  }

  const handleRemoveKid = async (kidId: string) => {
    if (!confirm('Are you sure you want to remove this child profile?')) return

    try {
      const res = await fetch(`/api/v1/parent/kids/${kidId}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.success) {
        fetchProfile()
        triggerToast('Child profile removed successfully')
      } else {
        throw new Error(json.error || 'Failed to delete child profile')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete kid profile')
    }
  }

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    try {
      setDeleteLoading(true)
      const res = await fetch('/api/v1/parent/account/delete', {
        method: 'POST'
      })
      const json = await res.json()
      if (json.success) {
        setDeleteModalOpen(false)
        await signOut({ callbackUrl: '/?message=' + encodeURIComponent('Account deleted. Data will be fully removed within 30 days.') })
      } else {
        throw new Error(json.error || 'Failed to delete account')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete your account. Contact support.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Profile Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  const parentName = profile?.name || 'Parent'
  const parentInitials = parentName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1565D8] border border-blue-100/50">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Settings</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage your personal information, child profiles, and settings.</p>
        </div>
      </div>

      {/* Floating Success Toast notification */}
      {successMsg && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl z-50 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-slate-300 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PERSONAL INFO CARD (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white border-slate-200 p-6 rounded-3xl shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 pb-3 border-b border-slate-50">
              Personal Information
            </h3>

            {/* Avatar Circle */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {parentInitials}
              </div>
              <h4 className="text-base font-black text-slate-800 mt-3">{parentName}</h4>
              <div className="flex items-center gap-1.5 mt-1.5 bg-blue-50 text-[#1565D8] px-2.5 py-1 rounded-full border border-blue-100/50">
                <Phone className="w-3 h-3 text-[#1565D8]" />
                <span className="text-[10px] font-bold">+91 {profile?.phone}</span>
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1 rounded">Verified</span>
              </div>
            </div>

            {/* Editable Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider block mb-1">Current City</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition appearance-none cursor-pointer"
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto transition shadow-sm mt-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>

            {/* Change Phone Link Container */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <span className="text-xs text-slate-750 font-bold">+91 {profile?.phone}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPhone('')
                  setOtpCode('')
                  setRequiresVerification(false)
                  setPhoneError(null)
                  setPhoneModalOpen(true)
                }}
                className="text-xs font-bold text-[#1565D8] hover:underline cursor-pointer"
              >
                Change Phone Number
              </button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: KIDS PROFILES & ACCOUNT SETTINGS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Kids profiles card */}
          <Card className="bg-white border-slate-200 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Children's Profiles
              </h3>
              <Button
                onClick={handleOpenAddKid}
                variant="outline"
                className="border-blue-100 text-[#1565D8] bg-blue-50/50 hover:bg-blue-50 font-bold text-xs px-3 py-1.5 rounded-xl h-auto flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Child
              </Button>
            </div>

            <div className="space-y-4">
              {profile && profile.kids.length > 0 ? (
                profile.kids.map((kid) => {
                  const kidInit = kid.name[0]?.toUpperCase() || 'C'
                  const formattedDob = kid.dateOfBirth 
                    ? new Date(kid.dateOfBirth).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Not set'

                  return (
                    <div 
                      key={kid.id}
                      className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 bg-slate-50/30 hover:border-slate-200 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1565D8] flex items-center justify-center font-bold text-sm shadow-inner">
                          {kidInit}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 leading-tight">{kid.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-450 font-semibold">
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              DOB: {formattedDob}
                            </span>
                            {kid.gradeSought && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-0.5">
                                  <Baby className="w-3 h-3 text-slate-400" />
                                  Grade: {kid.gradeSought}
                                </span>
                              </>
                            )}
                            {kid.gender && (
                              <>
                                <span className="text-slate-300">•</span>
                                <Badge className="bg-slate-100 text-slate-600 font-extrabold text-[8px] px-1 py-0.2 rounded uppercase">
                                  {kid.gender}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditKid(kid)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveKid(kid.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 bg-slate-50/50 border border-slate-150 border-dashed rounded-2xl p-6">
                  <Baby className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
                  <h4 className="text-xs font-bold text-slate-700">No child profiles added yet</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Add your children's details to pre-fill admission applications easily.</p>
                  <Button
                    onClick={handleOpenAddKid}
                    className="mt-3 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-[10px] uppercase py-1.5 px-4 rounded-full h-auto"
                  >
                    Add Child
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Account Settings Card */}
          <Card className="bg-white border-slate-200 p-6 rounded-3xl shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 pb-3 border-b border-slate-50">
              Notification & Privacy Preferences
            </h3>

            {/* Notification preferences */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Bell className="w-3.5 h-3.5" /> Notification Channels
              </h4>

              {/* Preference Toggle 1 */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Email Notifications</span>
                  <span className="text-[10px] text-slate-400 block">Receive admission updates and newsletters.</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateNotificationPref('email')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    notifications.email ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    notifications.email ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Preference Toggle 2 */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">SMS Alerts</span>
                  <span className="text-[10px] text-slate-400 block">Receive instant OTP codes and emergency alerts.</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateNotificationPref('sms')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    notifications.sms ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    notifications.sms ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Preference Toggle 3 */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">WhatsApp Updates</span>
                  <span className="text-[10px] text-slate-400 block">Get direct response notifications from schools.</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateNotificationPref('whatsapp')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    notifications.whatsapp ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    notifications.whatsapp ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Privacy preferences */}
            <div className="space-y-4 mt-6">
              <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Users className="w-3.5 h-3.5" /> Privacy & Contact
              </h4>

              {/* Privacy Toggle 1 */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Allow schools to contact me</span>
                  <span className="text-[10px] text-slate-400 block">Let verified schools view contact and trigger call assistance.</span>
                </div>
                <button
                  type="button"
                  onClick={() => updatePrivacyPref('allowContact')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    privacy.allowContact ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    privacy.allowContact ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Privacy Toggle 2 */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Show my profile to schools</span>
                  <span className="text-[10px] text-slate-400 block">Allow recommendation matching engine to propose your profile.</span>
                </div>
                <button
                  type="button"
                  onClick={() => updatePrivacyPref('showProfile')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    privacy.showProfile ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    privacy.showProfile ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-5 border-t border-red-100">
              <h4 className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mb-2">Danger Zone</h4>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs font-bold text-red-650 hover:text-red-700 hover:underline cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </Card>

        </div>

      </div>

      {/* 1. CHANGE PHONE MODAL (OTP FLOW) */}
      {phoneModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Change Phone Number</h3>
              <button onClick={() => setPhoneModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePhoneChangeSubmit} className="space-y-4">
              {phoneError && (
                <div className="p-2.5 bg-red-50 border border-red-250 rounded-xl text-red-600 text-xs font-semibold">
                  {phoneError}
                </div>
              )}

              {!requiresVerification ? (
                <div>
                  <p className="text-[10px] text-slate-550 font-bold mb-3 leading-relaxed">
                    Enter your new 10-digit mobile number. We will send an SMS OTP verification code.
                  </p>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">New Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-xs text-slate-400 font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-xs font-bold tracking-widest text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold mb-3 bg-emerald-50 p-2 border border-emerald-100 rounded-xl">
                    OTP Code sent to +91 {newPhone}. Enter the code below to verify changes.
                  </p>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Verification OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-center text-sm font-bold tracking-widest text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                    placeholder="Enter Code"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={phoneLoading}
                className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl h-auto"
              >
                {phoneLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Please wait...
                  </>
                ) : requiresVerification ? (
                  'Verify and Update'
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD/EDIT CHILD MODAL */}
      {kidModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {editingKid ? 'Edit Child Profile' : 'Add Child Profile'}
              </h3>
              <button onClick={() => setKidModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKidSubmit} className="space-y-4">
              {kidError && (
                <div className="p-2.5 bg-red-50 border border-red-250 rounded-xl text-red-600 text-xs font-semibold">
                  {kidError}
                </div>
              )}

              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Child's Name</label>
                <input
                  type="text"
                  required
                  value={kidFormData.name}
                  onChange={e => setKidFormData({ ...kidFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  placeholder="Enter child's full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={kidFormData.dob}
                    onChange={e => setKidFormData({ ...kidFormData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
                  <select
                    value={kidFormData.gender}
                    onChange={e => setKidFormData({ ...kidFormData, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Current Class / Grade</label>
                <select
                  value={kidFormData.grade}
                  onChange={e => setKidFormData({ ...kidFormData, grade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                >
                  <option value="">Select Grade</option>
                  {GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setKidModalOpen(false)}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl h-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={kidSaving}
                  className="flex-1 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto"
                >
                  {kidSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...
                    </>
                  ) : (
                    'Save Child'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CONFIRM DELETE ACCOUNT MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-slate-100 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Delete Your Account?</h3>
            <p className="text-[10px] text-slate-450 font-bold leading-relaxed mb-4">
              WARNING: This action is permanent. All your data, submitted enquiries, applications, bookmarks, and child profiles will be deactivated.
            </p>

            <div className="mb-6 space-y-2">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block text-left">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-red-550 focus:bg-white transition text-center uppercase"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeleteConfirmText('')
                }}
                variant="outline"
                className="flex-1 border-slate-200 text-slate-750 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl h-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
