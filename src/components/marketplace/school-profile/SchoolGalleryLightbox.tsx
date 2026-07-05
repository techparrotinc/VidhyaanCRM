"use client"

import React from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

type MediaItem = { url: string; caption?: string | null }

type SchoolGalleryLightboxProps = {
  media: MediaItem[]
  index: number | null
  onClose: () => void
  onIndexChange: (updater: (prev: number | null) => number | null) => void
}

export default function SchoolGalleryLightbox({
  media,
  index,
  onClose,
  onIndexChange,
}: SchoolGalleryLightboxProps) {
  if (index === null || !media || !media[index]) return null

  return (
    <Dialog open={index !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-4xl bg-black/95 border-none p-0 select-none text-white overflow-hidden flex flex-col items-center justify-center h-[80vh] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full h-full flex items-center justify-center p-8 relative">
          {media.length > 1 && (
            <>
              <button
                onClick={() => onIndexChange((prev) => (prev! === 0 ? media.length - 1 : prev! - 1))}
                className="absolute left-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 z-45 transition cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => onIndexChange((prev) => (prev! === media.length - 1 ? 0 : prev! + 1))}
                className="absolute right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 z-45 transition cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={media[index].url}
            alt={media[index].caption || `Photo ${index + 1}`}
            className="max-w-full max-h-[70vh] object-contain rounded"
          />
        </div>

        {media[index].caption && (
          <div className="absolute bottom-4 left-0 right-0 text-center bg-black/40 py-2 px-4 text-xs font-semibold text-slate-350">
            {media[index].caption}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
