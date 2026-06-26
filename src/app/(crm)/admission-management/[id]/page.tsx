"use client"

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  Calendar,
  Mail,
  Phone,
  User,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
  UserCheck,
  FolderOpen,
  Loader2,
  FileX,
  Trash2,
  MoreVertical,
  Pencil,
  ChevronDown,
  Shield as ShieldIcon,
  Image,
  File,
  Upload,
  MessageSquare,
  Send
} from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import { Skeleton } from "@/components/ui/skeleton"
import RecordSkeleton from "@/components/shared/RecordSkeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

// Grades constants are imported from @/constants/grades

const formatStatus = (status: string): string => {
  const labels: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
    ADMITTED: 'Admitted',
    REJECTED: 'Rejected',
    WAITLISTED: 'Waitlisted',
    WITHDRAWN: 'Withdrawn',
  }
  return labels[status] || status
}

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-200',
  ADMITTED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  WAITLISTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  WITHDRAWN: 'bg-slate-100 text-slate-600 border border-slate-200',
}

export default function AdmissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const admissionId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [admission, setAdmission] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [menuOpen])

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Delete this admission record?'
    )
    if (!confirmed) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/v1/admissions/${admissionId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error()
      showToast('Admission deleted', 'success')
      router.push('/admission-management')
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const { data: session } = useSession()
  const isOrgAdmin = session?.user?.role === 'ORG_ADMIN'

  // Documents state
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDocName, setUploadDocName] = useState('')
  const [uploadDocType, setUploadDocType] = useState('Admission Form')
  const [uploadDocUrl, setUploadDocUrl] = useState('')
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  
  // Convert to Student state
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertStudentName, setConvertStudentName] = useState('')
  const [convertStudentDob, setConvertStudentDob] = useState('')
  const [convertStudentGrade, setConvertStudentGrade] = useState('')
  const [convertStudentSection, setConvertStudentSection] = useState('')
  const [convertStudentRollNumber, setConvertStudentRollNumber] = useState('')
  const [convertStudentGuardianName, setConvertStudentGuardianName] = useState('')
  const [convertError, setConvertError] = useState('')
  const [isSubmittingConvert, setIsSubmittingConvert] = useState(false)

  // Stage inline state
  const [pipelineStages, setPipelineStages] = useState<any[]>([])
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)

  // Activity Logging State
  const [activities, setActivities] = useState<any[]>([])
  const [activityType, setActivityType] = useState<'NOTE' | 'CALL' | 'WHATSAPP' | 'EMAIL'>('NOTE')
  const [activityText, setActivityText] = useState('')
  const [isLoggingActivity, setIsLoggingActivity] = useState(false)

  // Toast state
  const [toastState, setToastState] = useState<{
    msg: string
    type: 'success' | 'info' | 'error'
    show: boolean
  }>({ msg: '', type: 'success', show: false })

  const showToast = (
    msg: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    setToastState({ msg, type, show: true })
    setTimeout(() => setToastState(t => ({ ...t, show: false })), 3000)
  }

  const toast = {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error')
  }

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/v1/admissions/${admissionId}`)
      const json = await res.json()
      setActivities(json.data?.activities || json.admission?.activities || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogActivity = async () => {
    if (!activityText.trim()) return
    setIsLoggingActivity(true)

    try {
      const res = await fetch(
        `/api/v1/admissions/${admissionId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: activityType,
            summary: activityText.trim(),
          })
        }
      )

      if (!res.ok) throw new Error()

      setActivityText('')
      setActivityType('NOTE')
      fetchActivities()
      toast.success('Activity logged')

    } catch {
      toast.error('Failed to log activity')
    } finally {
      setIsLoggingActivity(false)
    }
  }

  // Fetch admission detail and stages
  const fetchAdmissionData = async () => {
    try {
      const res = await fetch(`/api/v1/admissions/${admissionId}`)
      if (!res.ok) throw new Error('Admission record not found')
      const json = await res.json()
      setAdmission(json.data)

      // Pre-fill form fields
      if (json.data) {
        setConvertStudentName(json.data.applicantName || '')
        setConvertStudentGrade(json.data.gradeSought || '')
        setConvertStudentGuardianName(json.data.lead?.parentName || '')
        setActivities(json.data.activities || [])
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load admission record details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/v1/settings/pipeline')
      if (res.ok) {
        const json = await res.json()
        setPipelineStages(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch stages', err)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/v1/admissions/${admissionId}/documents`)
      if (res.ok) {
        const json = await res.json()
        setDocuments(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch documents', err)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await fetch(`/api/v1/admissions/${admissionId}/documents/${docId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showToast('Document deleted successfully')
        fetchDocuments()
        fetchAdmissionData()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to delete document', 'error')
    }
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('File too large. Max 10MB.', 'error')
      return
    }

    setUploadingDoc(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'admissions')

      const uploadRes = await fetch(
        '/api/v1/files/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!uploadRes.ok)
        throw new Error('Upload failed')

      const { url } = await uploadRes.json()

      const docRes = await fetch(
        `/api/v1/admissions/${admissionId}/documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
            url,
            sizeBytes: file.size,
          }),
        }
      )

      if (!docRes.ok)
        throw new Error('Save failed')

      showToast('Document uploaded', 'success')
      fetchDocuments()
      fetchAdmissionData()

    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploadingDoc(false)
      e.target.value = ''
    }
  }

  const DocumentCard = ({ doc }: { doc: any }) => {
    const sizeText = doc.sizeBytes 
      ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` 
      : 'N/A'

    const getIconAndBg = (fileName: string) => {
      const name = fileName.toLowerCase()
      if (name.endsWith('.pdf')) {
        return {
          bg: 'bg-red-50',
          text: 'text-red-500',
          Icon: FileText
        }
      }
      if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-500',
          Icon: Image
        }
      }
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        Icon: File
      }
    }

    const { bg, text, Icon } = getIconAndBg(doc.name)

    const dateFormatted = doc.createdAt 
      ? new Date(doc.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : ''

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3 text-left">
        {/* LEFT: File icon in colored box */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
          <Icon size={20} />
        </div>

        {/* CENTER: flex-1 min-w-0 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-850 truncate" title={doc.name}>
            {doc.name}
          </p>
          <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
            {doc.sizeBytes && <span>{sizeText}</span>}
            {dateFormatted && (
              <>
                <span className="text-slate-355">·</span>
                <span>{dateFormatted}</span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Status + Actions */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Status Badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            doc.scanStatus === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
            doc.scanStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {doc.scanStatus === 'APPROVED' ? 'Approved' : doc.scanStatus === 'REJECTED' ? 'Rejected' : 'Pending'}
          </span>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 mt-1">
            {isOrgAdmin && doc.scanStatus === 'PENDING' && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => handleUpdateDocStatus(doc.id, 'APPROVED')}
                  className="p-1 text-green-600 hover:bg-green-55 rounded cursor-pointer"
                  title="Approve Document"
                >
                  <Check size={13} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => handleUpdateDocStatus(doc.id, 'REJECTED')}
                  className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer"
                  title="Reject Document"
                >
                  <XCircle size={13} />
                </button>
              </div>
            )}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#1565D8] hover:underline"
            >
              View
            </a>
            <button
              onClick={() => handleDeleteDoc(doc.id)}
              className="text-xs text-red-555 hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleUpdateDocStatus = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    let rejectionReason = null
    if (status === 'REJECTED') {
      rejectionReason = prompt('Enter reason for rejection (optional):')
      if (rejectionReason === null) return
    }
    try {
      const res = await fetch(`/api/v1/admissions/${admissionId}/documents/${docId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanStatus: status, rejectionReason })
      })
      if (res.ok) {
        showToast(`Document marked as ${status.toLowerCase()}`)
        fetchDocuments()
        fetchAdmissionData()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to update document status', 'error')
    }
  }

  useEffect(() => {
    if (admissionId) {
      fetchAdmissionData()
      fetchStages()
      fetchDocuments()
    }
  }, [admissionId])

  const handleStageChange = async (newStageId: string) => {
    try {
      setIsUpdatingStage(true)
      const res = await fetch(`/api/v1/admissions/${admissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: newStageId })
      })
      if (!res.ok) throw new Error('Failed to update stage')
      showToast('Admission stage updated successfully')
      fetchAdmissionData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to update stage', 'error')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  const handleConvert = async () => {
    try {
      setIsSubmittingConvert(true)
      setConvertError('')
      const res = await fetch(`/api/v1/admissions/${admissionId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: convertStudentName,
          dateOfBirth: convertStudentDob || undefined,
          gradeLabel: convertStudentGrade,
          rollNumber: convertStudentRollNumber || undefined,
          guardianName: convertStudentGuardianName || undefined
        })
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to convert to student record')
      }
      showToast(`Student record created: ${json.data.studentCode || 'STU-XXXXX'}`)
      setShowConvertModal(false)
      router.push(`/student-management/${json.data.id}`)
    } catch (err: any) {
      console.error(err)
      setConvertError(err.message || 'Failed to convert to student')
    } finally {
      setIsSubmittingConvert(false)
    }
  }

  if (loading) {
    return <RecordSkeleton />
  }

  if (!admission) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Admission Record Not Found</h3>
        <p className="text-sm text-slate-500 mb-4">The admission record you are looking for does not exist or has been deleted.</p>
        <button
          onClick={() => router.push('/admission-management')}
          className="bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          Back to Admission Management
        </button>
      </div>
    )
  }

  const isAdmitted = admission.status === 'ADMITTED' || admission.stage?.isWon === true
  const isConverted = !!admission.student

  return (
    <>
      <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 max-w-7xl mx-auto w-full flex-1">
        {/* PAGE HEADER */}
        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 sm:px-6 py-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft size={18} className="text-slate-500" strokeWidth={1.5} />
              </button>

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold flex items-center justify-center flex-shrink-0">
                {admission.applicantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
              </div>

              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 Poppins leading-tight max-w-[120px] sm:max-w-[200px] truncate">
                  {admission.applicantName}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-slate-400">
                  <span>Grade: {getGradeLabel(admission.gradeSought || '—')}</span>
                  <span className="text-slate-200">·</span>
                  <span>Phone: {admission.phone || '—'}</span>
                  <span className="hidden sm:inline text-slate-200">·</span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 font-mono">{admission.admissionCode}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              <button
                onClick={() => router.push(`/admission-management/${admissionId}/edit`)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm font-sans h-10 sm:h-9"
              >
                <Pencil size={14} className="text-slate-500" />
                <span className="hidden sm:inline">Edit Admission</span>
              </button>
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = buttonRef.current?.getBoundingClientRect()
                    if (rect) {
                      setMenuPos({
                        top: rect.bottom + 4,
                        left: rect.right - 160,
                      })
                    }
                    setMenuOpen(!menuOpen)
                  }}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm cursor-pointer animate-fade-in"
                >
                  <MoreVertical size={16} className="text-slate-600" />
                </button>
              </div>

              {isConverted ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-green-200 bg-green-50 text-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  Converted
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusColors[admission.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {formatStatus(admission.status)}
                </span>
              )}

              {menuOpen && typeof document !== 'undefined' &&
                createPortal(
                  <div
                    ref={menuRef}
                    style={{
                      position: 'fixed',
                      top: menuPos.top,
                      left: menuPos.left,
                      zIndex: 9999,
                    }}
                    className="w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-left"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        router.push(`/admission-management/${admission.id}/edit`)
                      }}
                      className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Pencil size={13} />
                      Edit Admission
                    </button>
                    {(admission.status !== 'ADMITTED' || !admission.student) && (
                      <>
                        <div className="h-px bg-slate-100 mx-2" />
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            handleDelete()
                          }}
                          className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2 transition-colors cursor-pointer font-medium"
                        >
                          <Trash2 size={13} />
                          Delete Admission
                        </button>
                      </>
                    )}
                  </div>,
                  document.body
                )
              }
            </div>
          </div>
        </Card>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
          
          {/* 1. Applicant Info Card */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 text-left order-1 col-span-1 sm:col-span-1 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Applicant Information</h4>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block">Applicant Name</span>
                <span className="text-sm font-medium text-slate-800">{admission.applicantName}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block">Phone</span>
                <span className="text-sm font-medium text-slate-800">{admission.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block">Email</span>
                <span className="text-sm font-medium text-slate-800">{admission.email || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block">Applying For (Grade)</span>
                <span className="text-sm font-medium text-slate-800">{getGradeLabel(admission.gradeSought || '—')}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block">Assigned Counsellor</span>
                <span className="text-sm font-medium text-slate-800">{admission.assignedTo?.name || 'Unassigned'}</span>
              </div>
              {admission.lead?.parentName && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block">Parent/Guardian Name</span>
                  <span className="text-sm font-medium text-slate-800">{admission.lead.parentName}</span>
                </div>
              )}
            </div>
          </Card>

          {/* 2. Admission Stage Card */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 text-left space-y-4 order-2 col-span-1 sm:col-span-1 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              ADMISSION STAGE
            </h4>
            
            <div className="relative">
              <label className="text-xs text-slate-400 block mb-1">Current Stage</label>
              <div className="relative w-full">
                <select
                  disabled={isUpdatingStage}
                  value={admission.stageId || ''}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full h-10 sm:h-9 px-3 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none transition"
                >
                  {pipelineStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Convert to Student Action Button */}
            {isAdmitted && !isConverted && (
              <div className="flex sm:justify-start">
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition shadow-sm cursor-pointer mt-4"
                >
                  <span>Convert to Student →</span>
                </button>
              </div>
            )}

            {isConverted && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Student record: {admission.student?.studentCode}</span>
              </div>
            )}
          </Card>

          {/* Log Activity Card */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 text-left order-3 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MessageSquare className="size-3.5 text-[#1565D8]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">
                  LOG ACTIVITY
                </span>
              </div>
            </div>

            <div className="flex gap-1 mb-3 p-1 bg-slate-50 rounded-lg w-fit">
              {(['NOTE', 'CALL', 'WHATSAPP', 'EMAIL'] as const).map((type) => {
                const isActive = activityType === type
                const label = type === 'NOTE' ? 'Note' : type === 'CALL' ? 'Call' : type === 'WHATSAPP' ? 'WhatsApp' : 'Email'
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActivityType(type)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      isActive ? 'bg-white shadow-sm text-[#1565D8]' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <textarea
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              rows={3}
              placeholder={
                activityType === 'NOTE'
                  ? 'Write a note about this admission...'
                  : activityType === 'CALL'
                  ? 'Summarize the call...'
                  : activityType === 'WHATSAPP'
                  ? 'What was discussed on WhatsApp...'
                  : 'Email summary...'
              }
              className="w-full resize-none border border-slate-200 rounded-lg p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            />

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                {activityText.length} chars
              </span>
              <button
                onClick={handleLogActivity}
                disabled={!activityText.trim() || isLoggingActivity}
                className="flex items-center gap-2 h-8 px-4 text-xs font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isLoggingActivity ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <Send size={12} />
                )}
                {isLoggingActivity ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </Card>

          {/* 3. Activity Timeline Card */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 text-left order-3 col-span-1 sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Activity Timeline</h4>
            {activities && activities.length > 0 ? (
              <div className="relative">
                {activities.length > 1 && (
                  <div className="absolute left-[7px] top-2.5 bottom-2.5 w-0.5 bg-slate-100" />
                )}
                <div className="space-y-4">
                  {activities.map((act) => {
                    const typeColors: Record<string, string> = {
                      NOTE: 'border-slate-400 text-slate-400',
                      CALL: 'border-blue-400 text-blue-400',
                      WHATSAPP: 'border-green-500 text-green-500',
                      EMAIL: 'border-purple-400 text-purple-400',
                      STAGE_CHANGE: 'border-amber-400 text-amber-400',
                      SYSTEM: 'border-slate-300 text-slate-300',
                      DOCUMENT: 'border-teal-400 text-teal-400',
                    }
                    const dotClass = typeColors[act.type] || 'border-slate-300 text-slate-300'
                    return (
                      <div key={act.id} className="flex gap-3 mb-4 last:mb-0 relative">
                        {/* Left: colored dot */}
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center z-10 relative bg-white border-2 ${dotClass}`}>
                          <div className="w-2 h-2 rounded-full bg-current" />
                        </div>
                        {/* Right: flex-1 */}
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 leading-snug">
                            {act.summary}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">
                              Performed by: {act.performedBy?.name || 'System'}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(act.createdAt), 'd MMM yyyy, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <FileText className="text-slate-200 mx-auto" size={20} />
                <p className="text-sm text-slate-400 mt-2">No activities yet</p>
                <p className="text-xs text-slate-300 mt-1">Log your first activity above</p>
              </div>
            )}
          </Card>

          {/* 4. Documents Card */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 text-left order-4 col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider font-sans">Documents</h4>
              
              <label
                htmlFor="doc-upload"
                className="cursor-pointer inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Upload size={14} />
                Upload Document
                <input
                  id="doc-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  multiple={false}
                />
              </label>
            </div>

            {uploadingDoc && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-3">
                <Loader2 className="animate-spin text-[#1565D8] flex-shrink-0" size={16} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700">
                    Uploading document...
                  </p>
                  <div className="mt-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1565D8] rounded-full animate-[loader_1s_ease-in-out_infinite] w-1/2" />
                  </div>
                </div>
              </div>
            )}

            {loadingDocs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-slate-400 size-6" />
              </div>
            ) : documents.length === 0 ? (
              <div className="py-6 text-center">
                <FileX className="size-20 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-sans">No documents uploaded yet</p>
                <p className="text-xs text-slate-300 mt-1 font-sans">Upload required files below</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* CONVERT TO STUDENT MODAL */}
      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent className="max-w-md w-full rounded-2xl p-6 text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex justify-between mb-2">
            <DialogTitle className="text-xl font-bold Poppins text-slate-900">Create Student Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mb-4">This applicant has been admitted. Create their student profile.</p>

          {convertError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {convertError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Name</label>
              <input
                type="text"
                value={convertStudentName}
                onChange={(e) => setConvertStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Date of Birth</label>
              <input
                type="date"
                value={convertStudentDob}
                onChange={(e) => setConvertStudentDob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Class / Grade</label>
              <select
                value={convertStudentGrade}
                onChange={(e) => setConvertStudentGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Class/Grade</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
                {convertStudentGrade && !GRADE_OPTIONS.some(opt => opt.value === convertStudentGrade) && (
                  <option value={convertStudentGrade}>{getGradeLabel(convertStudentGrade)}</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Section (Optional)</label>
                <input
                  type="text"
                  value={convertStudentSection}
                  onChange={(e) => setConvertStudentSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. A"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Roll Number (Optional)</label>
                <input
                  type="text"
                  value={convertStudentRollNumber}
                  onChange={(e) => setConvertStudentRollNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 101"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Parent/Guardian Name</label>
              <input
                type="text"
                value={convertStudentGuardianName}
                onChange={(e) => setConvertStudentGuardianName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Parent/Guardian Name"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              disabled={isSubmittingConvert}
              onClick={() => {
                setShowConvertModal(false)
                setConvertError('')
              }}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSubmittingConvert}
              onClick={handleConvert}
              className={`flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${isSubmittingConvert ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmittingConvert ? (
                <>
                  <Loader2 className="animate-spin size-4 mr-2" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Student Record →</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>



      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <ShieldIcon className="text-[#1565D8] animate-pulse" size={40}/>
          <div className="mt-3 w-12 h-0.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#1565D8] rounded-full animate-[loader_1s_ease-in-out_infinite]"/>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastState.show && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg transition duration-300 animate-slide-in ${toastState.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
          {toastState.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastState.msg}</span>
        </div>
      )}
    </>
  )
}
