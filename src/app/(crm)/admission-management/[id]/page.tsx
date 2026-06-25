"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  MoreVertical
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

export default function AdmissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const admissionId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [admission, setAdmission] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this admission record? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const res = await fetch(
        `/api/v1/admissions/${admissionId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(
          err.message ||
          'Failed to delete admission'
        )
      }

      showToast(
        'Admission record deleted',
        'success'
      )
      router.push('/admission-management')

    } catch (err: any) {
      showToast(err.message ||
        'Failed to delete',
        'error'
      )
    } finally {
      setIsDeleting(false)
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

  // Toast state
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'info' | 'error'
    show: boolean
  }>({ msg: '', type: 'success', show: false })

  const showToast = (
    msg: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    setToast({ msg, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
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

  const handleUploadDoc = async () => {
    if (!uploadDocName.trim() || !uploadDocUrl.trim()) {
      showToast('Document Name and URL are required', 'error')
      return
    }
    try {
      setIsUploadingDoc(true)
      const res = await fetch(`/api/v1/admissions/${admissionId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadDocName.trim(),
          type: uploadDocType,
          url: uploadDocUrl.trim()
        })
      })
      if (res.ok) {
        showToast('Document uploaded successfully')
        setShowUploadModal(false)
        setUploadDocName('')
        setUploadDocUrl('')
        fetchDocuments()
        fetchAdmissionData()
      } else {
        const json = await res.json()
        throw new Error(json.error || 'Failed to upload document')
      }
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to upload document', 'error')
    } finally {
      setIsUploadingDoc(false)
    }
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
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* PAGE HEADER */}
        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft size={18} className="text-slate-500" strokeWidth={1.5} />
              </button>

              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-100 text-blue-700 text-sm md:text-base font-bold flex items-center justify-center flex-shrink-0">
                {admission.applicantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
              </div>

              <div className="min-w-0">
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-slate-800 Poppins leading-tight">
                  {admission.applicantName}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs md:text-sm text-slate-400">
                  <span>Grade Sought: {getGradeLabel(admission.gradeSought || '—')}</span>
                  <span className="text-slate-200">·</span>
                  <span>Phone: {admission.phone || '—'}</span>
                  <span className="text-slate-200">·</span>
                  <span>{admission.admissionCode}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              <button
                onClick={() => router.push(`/admission-management/${admissionId}/edit`)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm font-sans"
              >
                Edit Admission
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-lg flex items-center justify-center cursor-pointer transition shadow-sm h-[32px] w-[32px] md:h-[34px] md:w-[34px]">
                    <MoreVertical size={16} className="text-slate-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 rounded-lg border border-slate-200 shadow-lg p-1.5 bg-white z-50">
                  {(admission.status !== 'ADMITTED' || !admission.student) && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-650 hover:bg-red-50 focus:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} className="text-red-500" />
                      Delete Admission
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800`}>
                Stage: {admission.stage?.name || 'New Lead'}
              </span>
              {isConverted ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-800">
                  Converted to Student
                </span>
              ) : (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isAdmitted ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                  Status: {admission.status}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMNS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Details */}
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-left">
              <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Applicant Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">Applicant Name</span>
                  <span className="text-sm font-semibold text-slate-700">{admission.applicantName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="text-sm font-semibold text-slate-700">{admission.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Email</span>
                  <span className="text-sm font-semibold text-slate-700">{admission.email || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Applying For (Grade)</span>
                  <span className="text-sm font-semibold text-slate-700">{getGradeLabel(admission.gradeSought || '—')}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Assigned Counsellor</span>
                  <span className="text-sm font-semibold text-slate-700">{admission.assignedTo?.name || 'Unassigned'}</span>
                </div>
                {admission.lead?.parentName && (
                  <div>
                    <span className="text-xs text-slate-400 block">Parent/Guardian Name</span>
                    <span className="text-sm font-semibold text-slate-700">{admission.lead.parentName}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline Activities */}
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-left">
              <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Activity Timeline</h4>
              {admission.activities && admission.activities.length > 0 ? (
                <div className="relative pl-6 border-l border-slate-100 space-y-6">
                  {admission.activities.map((act: any) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{act.summary}</p>
                          <span className="text-xs text-slate-400 mt-1 block">
                            {new Date(act.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No activity logged yet.</p>
              )}
            </Card>

            {/* Documents Section */}
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-left">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">Documents</h4>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-[#1565D8] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition cursor-pointer font-sans"
                >
                  <Plus size={13} />
                  Upload
                </button>
              </div>

              {loadingDocs ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-slate-400 size-6" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <FileX size={40} className="text-slate-200 mb-2" />
                  <p className="text-sm font-bold text-slate-500 font-sans">No documents uploaded yet</p>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Upload required files for verification</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documents.map((doc) => {
                    const sizeText = doc.sizeBytes 
                      ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` 
                      : 'N/A'
                    
                    return (
                      <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate font-sans">{doc.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-sans">
                              <span className="capitalize">{doc.type}</span>
                              <span>·</span>
                              <span>{sizeText}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Scan Status Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            doc.scanStatus === 'APPROVED'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : doc.scanStatus === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {doc.scanStatus === 'APPROVED' ? 'Approved' : doc.scanStatus === 'REJECTED' ? 'Rejected' : 'Pending Review'}
                          </span>

                          {/* ORG_ADMIN action buttons */}
                          {isOrgAdmin && doc.scanStatus === 'PENDING' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateDocStatus(doc.id, 'APPROVED')}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Approve Document"
                              >
                                <Check size={14} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => handleUpdateDocStatus(doc.id, 'REJECTED')}
                                className="p-1 text-red-650 hover:bg-red-50 rounded"
                                title="Reject Document"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}

                          {/* View link */}
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#1565D8] hover:underline px-2 py-1 font-sans"
                          >
                            View
                          </a>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete Document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Actions Panel */}
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                ADMISSION STAGE
              </h4>
              
              <div className="relative">
                <label className="text-xs text-slate-400 block mb-1">Current Stage</label>
                <select
                  disabled={isUpdatingStage}
                  value={admission.stageId || ''}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {pipelineStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>

              {/* Convert to Student Action Button */}
              {isAdmitted && !isConverted && (
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition shadow-sm cursor-pointer mt-4"
                >
                  <span>Convert to Student →</span>
                </button>
              )}

              {isConverted && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>Student record: {admission.student?.studentCode}</span>
                </div>
              )}
            </Card>
          </div>
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

      {/* DOCUMENT UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md w-full rounded-2xl p-6 text-left">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold text-slate-900 font-sans">Upload Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider font-sans">Document Name</label>
              <input
                type="text"
                value={uploadDocName}
                onChange={(e) => setUploadDocName(e.target.value)}
                placeholder="e.g. Birth Certificate"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider font-sans">Document Type</label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="Admission Form">Admission Form</option>
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="Transfer Certificate">Transfer Certificate</option>
                <option value="Photo">Photo</option>
                <option value="Address Proof">Address Proof</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider font-sans">Document URL</label>
              <input
                type="url"
                value={uploadDocUrl}
                onChange={(e) => setUploadDocUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Paste the link of the uploaded file</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              disabled={isUploadingDoc}
              onClick={() => setShowUploadModal(false)}
              className="flex-1 border border-slate-200 text-slate-650 text-sm font-semibold py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              disabled={isUploadingDoc || !uploadDocName.trim() || !uploadDocUrl.trim()}
              onClick={handleUploadDoc}
              className={`flex-1 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${isUploadingDoc ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isUploadingDoc ? (
                <>
                  <Loader2 className="animate-spin size-4 mr-2" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Document</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg transition duration-300 animate-slide-in ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  )
}
