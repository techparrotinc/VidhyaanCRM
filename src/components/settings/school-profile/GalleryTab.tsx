"use client"

import React from 'react'
import Link from 'next/link'
import {
  Loader2, Trash2, School, Image as ImageIcon, Upload, Zap,
  ShieldCheck, Star, ArrowUp, ArrowDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type GalleryTabProps = {
  mediaList: any[]
  planSlug: string
  uploading: boolean
  uploadProgress: number
  scanStatus: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, caption: 'logo' | 'cover' | 'gallery') => void
  onDeleteMedia: (id: string) => void
  onSetPrimary: (id: string) => void
  onMoveMedia: (index: number, direction: 'up' | 'down') => void
  onSaveOrder: () => void
  saving: boolean
}

export default function GalleryTab({
  mediaList,
  planSlug,
  uploading,
  uploadProgress,
  scanStatus,
  fileInputRef,
  onPhotoUpload,
  onDeleteMedia,
  onSetPrimary,
  onMoveMedia,
  onSaveOrder,
  saving
}: GalleryTabProps) {
  const logo = mediaList.find((m) => m.caption === 'logo')
  const cover = mediaList.find((m) => m.caption === 'cover')
  const galleryCount = mediaList.filter((m) => m.caption === 'gallery').length

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Photo Gallery</h3>
          <p className="text-xs text-slate-400">Upload school logo, cover banner, and student life images.</p>
        </div>
        <div>
          {planSlug === 'free' ? (
            <Badge variant="secondary" className="bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1 text-xs">
              Free Plan: {galleryCount}/3 Gallery Photos
            </Badge>
          ) : (
            <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-1 text-xs">
              Premium Plan: Unlimited Photos
            </Badge>
          )}
        </div>
      </div>

      {/* Logo & Cover Specific block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-slate-100 bg-slate-50/40 rounded-2xl mb-6">
        <div className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Institution Logo</span>
          {logo ? (
            <div className="relative w-24 h-24 border border-slate-200 rounded-xl overflow-hidden mb-3">
              <img src={logo.url} alt="Logo" className="w-full h-full object-contain" />
              <button
                onClick={() => onDeleteMedia(logo.id)}
                className="absolute bottom-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-md cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <School className="w-8 h-8 text-slate-300" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => onPhotoUpload(e, 'logo')} className="hidden" id="logo-upload-input" />
          <Button
            onClick={() => document.getElementById('logo-upload-input')?.click()}
            disabled={uploading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 border border-slate-200 shadow-none h-auto rounded-lg"
          >
            Upload Logo
          </Button>
        </div>

        <div className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Hero Cover Image</span>
          {cover ? (
            <div className="relative w-full h-24 border border-slate-200 rounded-xl overflow-hidden mb-3">
              <img src={cover.url} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => onDeleteMedia(cover.id)}
                className="absolute bottom-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-md cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => onPhotoUpload(e, 'cover')} className="hidden" id="cover-upload-input" />
          <Button
            onClick={() => document.getElementById('cover-upload-input')?.click()}
            disabled={uploading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 border border-slate-200 shadow-none h-auto rounded-lg"
          >
            Upload Cover
          </Button>
        </div>
      </div>

      {/* Gallery Photos block */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Gallery Items</h4>
          {planSlug === 'free' && galleryCount >= 3 ? (
            <div className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Limit reached. </span>
              <Link href="/settings/billing" className="text-[#1565D8] hover:underline font-bold">Upgrade for unlimited</Link>
            </div>
          ) : (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-50 hover:bg-blue-100 text-[#1565D8] text-xs font-semibold px-4 py-2 border border-blue-100 h-auto rounded-lg shadow-none flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Photo
            </Button>
          )}
          <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => onPhotoUpload(e, 'gallery')} className="hidden" />
        </div>

        {uploading && (
          <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-800">
              <span className="flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning and Uploading to DO Spaces...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1.5 bg-blue-100" />
            {scanStatus === 'scanning' && (
              <span className="text-[10px] text-slate-500 block font-semibold">
                🔬 DigitalOcean ClamAV & AI Vision scanning file for security checks...
              </span>
            )}
            {scanStatus === 'passed' && (
              <span className="text-[10px] text-emerald-600 block font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-505" /> Scan passed! Clean photo saved.
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {mediaList
            .filter((m) => m.caption === 'gallery' || m.caption === 'cover')
            .map((item, index, filteredArray) => {
              const isPrimary = item.caption === 'cover'
              return (
                <div
                  key={item.id}
                  className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-36 flex flex-col transition hover:shadow-md"
                >
                  <img src={item.url} alt="Gallery" className="w-full h-24 object-cover" />

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                    <button
                      onClick={() => onSetPrimary(item.id)}
                      title={isPrimary ? 'Primary Cover Photo' : 'Set as Primary Cover'}
                      className={`p-1.5 rounded-md cursor-pointer transition ${
                        isPrimary
                          ? 'bg-amber-400 text-white hover:bg-amber-500'
                          : 'bg-white/80 hover:bg-white text-slate-600'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => onDeleteMedia(item.id)}
                      className="p-1.5 bg-white/80 hover:bg-red-500 hover:text-white text-red-600 rounded-md cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 px-2.5 py-1.5 bg-white flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Index {index + 1}</span>
                    <div className="flex items-center gap-0.5">
                      <button
                        disabled={index === 0}
                        onClick={() => onMoveMedia(index, 'up')}
                        className="p-0.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={index === filteredArray.length - 1}
                        onClick={() => onMoveMedia(index, 'down')}
                        className="p-0.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button
          onClick={onSaveOrder}
          disabled={saving}
          className={`bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin size-4 mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Order</span>
          )}
        </Button>
      </div>
    </div>
  )
}
