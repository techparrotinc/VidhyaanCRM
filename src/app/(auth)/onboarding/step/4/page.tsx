'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Upload, Camera, Trash2, CheckCircle } from 'lucide-react'
import {
  INSTITUTION_CONFIG,
  type InstitutionType,
} from '@/constants/institutionConfig'

export default function OnboardingStep4() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Images state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])

  // Progress/Uploading state
  const [uploadTarget, setUploadTarget] = useState<'logo' | 'cover' | number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [institutionType, setInstitutionType] = useState('SCHOOL')
  const config = INSTITUTION_CONFIG[
    institutionType as InstitutionType
  ] ?? INSTITUTION_CONFIG['SCHOOL']

  useEffect(() => {
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          const s = data.school
          if (s.institutionType) {
            setInstitutionType(s.institutionType)
          }
          if (s.media) {
            const logo = s.media.find((m: any) => m.caption === 'logo')
            const cover = s.media.find((m: any) => m.caption === 'cover')
            const gallery = s.media.filter((m: any) => m.caption === 'gallery')

            if (logo) setLogoUrl(logo.url)
            if (cover) setCoverUrl(cover.url)
            if (gallery.length > 0) {
              setGalleryUrls(gallery.map((g: any) => g.url))
            }
          }
        }
      })
      .catch((err) => console.error('Error prefilling step 4 photos:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover' | number) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    const maxSize = target === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024 // 2MB or 5MB
    if (file.size > maxSize) {
      setError(`File is too large. Max size allowed is ${maxSize / (1024 * 1024)}MB.`)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Please select an image file (JPG, PNG, WEBP).')
      return
    }

    setError(null)
    setUploadTarget(target)
    setUploadProgress(0)

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p >= 95 ? 95 : p + 15))
    }, 100)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/v1/files/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      // Save to appropriate state
      if (target === 'logo') {
        setLogoUrl(data.url)
      } else if (target === 'cover') {
        setCoverUrl(data.url)
      } else {
        // Gallery slot index
        setGalleryUrls((prev) => {
          const updated = [...prev]
          updated[target] = data.url
          return updated.filter(Boolean) // filter out empty values
        })
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'File upload failed. Please try again.')
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setUploadTarget(null)
        setUploadProgress(0)
      }, 300)
    }
  }

  const handleDeletePhoto = (target: 'logo' | 'cover' | number) => {
    if (target === 'logo') {
      setLogoUrl(null)
    } else if (target === 'cover') {
      setCoverUrl(null)
    } else {
      setGalleryUrls((prev) => prev.filter((_, i) => i !== target))
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!logoUrl) {
      setError('Profile Logo is required to complete the onboarding setup.')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/v1/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 4,
          data: {
            logoUrl,
            coverUrl,
            galleryUrls: galleryUrls.filter(Boolean)
          }
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save photos')
      }

      router.push('/onboarding/step/5')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to save photo configurations.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/step/5')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 flex-1">
        <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Loading photo setup...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800">Add Photos to Your Profile</h2>
          <p className="text-sm text-slate-500">{config.nameLabel}s with photos get 3x more enquiries</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 mb-6 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* SCHOOL LOGO UPLOAD */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {config.nameLabel} Logo <span className="text-red-500">*</span> <span className="text-[10px] font-normal text-slate-400 font-sans">(Max 2MB)</span>
              </label>
              
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 group bg-white shadow-sm flex items-center justify-center">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    <button
                      onClick={() => handleDeletePhoto('logo')}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center cursor-pointer select-none text-slate-400">
                    {uploadTarget === 'logo' ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 className="w-5 h-5 animate-spin text-[#1565D8]" />
                        <span className="text-[9px] font-bold text-slate-500">{uploadProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Upload Logo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                      disabled={uploadTarget !== null}
                    />
                  </label>
                )}
                
                <div className="text-slate-400 text-xs max-w-[280px]">
                  Required for Go Live. Select a clean high-resolution logo (JPG or PNG) representing your institution.
                </div>
              </div>
            </div>

            {/* COVER PHOTO UPLOAD */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cover Photo <span className="text-[10px] font-normal text-slate-400 font-sans">(Max 5MB, 16:9 recommended)</span>
              </label>

              {coverUrl ? (
                <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeletePhoto('cover')}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-[180px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center cursor-pointer select-none text-slate-400">
                  {uploadTarget === 'cover' ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1565D8]" />
                      <span className="text-xs font-bold text-slate-500">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 mb-1.5" />
                      <span className="text-xs font-bold text-slate-700">Upload Cover Photo</span>
                      <span className="text-[10px] text-slate-400">This photo will appear as the banner on your public profile</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'cover')}
                    className="hidden"
                    disabled={uploadTarget !== null}
                  />
                </label>
              )}
            </div>

            {/* GALLERY PHOTOS */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Add Gallery Photos
                </label>
                <span className="text-[10px] text-slate-400 font-sans block">
                  Free plan includes up to 3 gallery photos of your {config.nameLabel.toLowerCase()} campus.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => {
                  const url = galleryUrls[idx]
                  const isUploadingThis = uploadTarget === idx

                  return (
                    <div key={idx} className="aspect-square">
                      {url ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 shadow-xs">
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(idx)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center cursor-pointer select-none text-slate-400">
                          {isUploadingThis ? (
                            <div className="flex flex-col items-center gap-1">
                              <Loader2 className="w-4 h-4 animate-spin text-[#1565D8]" />
                              <span className="text-[9px] font-bold text-slate-500">{uploadProgress}%</span>
                            </div>
                          ) : (
                            <>
                              <Camera className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-bold">Add Photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, idx)}
                            className="hidden"
                            disabled={uploadTarget !== null}
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Photo Tips Card */}
          <div className="bg-blue-50/20 rounded-2xl border border-blue-50/50 p-5 self-start space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-blue-50/80 pb-2">
              <CheckCircle className="w-4.5 h-4.5 text-[#1565D8]" />
              <span>Tips for Great Photos</span>
            </h4>
            
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-1.5">
                <span className="text-[#1565D8] font-bold shrink-0">✓</span>
                <span>Use natural daylight for photography</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#1565D8] font-bold shrink-0">✓</span>
                <span>Show clean classrooms and facilities</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#1565D8] font-bold shrink-0">✓</span>
                <span>Include sports and dynamic activities</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#1565D8] font-bold shrink-0">✓</span>
                <span>Avoid blurry, pixelated or dark photos</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#1565D8] font-bold shrink-0">✓</span>
                <span>Upload images above 800x600 pixels</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
        <button
          onClick={() => router.push('/onboarding/step/3')}
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
            onClick={() => handleSubmit()}
            disabled={saving || !logoUrl}
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
