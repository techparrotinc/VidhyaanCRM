"use client"

import React, { useState } from 'react'
import { Star, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export type SubmittedReview = {
  id: string
  rating: number
  title: string
  content: string
  createdAt: string
  parent: { name: string }
  ratingAcademics: number
  ratingFaculty: number
  ratingInfrastructure: number
  ratingSafety: number
  ratingActivities: number
  ratingValue: number
}

type ReviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (review: SubmittedReview) => void
  /** stable id source; caller passes a value so the component stays deterministic */
  makeId: () => string
}

const EMPTY = {
  rating: 5,
  title: '',
  content: '',
  reviewerName: '',
  ratingAcademics: 5,
  ratingFaculty: 5,
  ratingInfrastructure: 5,
  ratingSafety: 5,
  ratingActivities: 5,
  ratingValue: 5
}

const SUB_RATINGS = [
  { key: 'ratingAcademics', label: 'Academics' },
  { key: 'ratingFaculty', label: 'Faculty' },
  { key: 'ratingInfrastructure', label: 'Infra' },
  { key: 'ratingSafety', label: 'Safety' },
  { key: 'ratingActivities', label: 'Activities' },
  { key: 'ratingValue', label: 'Value' }
] as const

export default function ReviewModal({ open, onOpenChange, onSubmit, makeId }: ReviewModalProps) {
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      id: makeId(),
      rating: form.rating,
      title: form.title || 'Parent Review',
      content: form.content,
      createdAt: new Date().toISOString(),
      parent: { name: form.reviewerName || 'Verified Parent' },
      ratingAcademics: form.ratingAcademics,
      ratingFaculty: form.ratingFaculty,
      ratingInfrastructure: form.ratingInfrastructure,
      ratingSafety: form.ratingSafety,
      ratingActivities: form.ratingActivities,
      ratingValue: form.ratingValue
    })
    setSubmitted(true)
    setTimeout(() => {
      onOpenChange(false)
      setSubmitted(false)
      setForm(EMPTY)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-800">Write a Review</DialogTitle>
          <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
            Share your child's experience. Your review helps other parents make informed choices.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Review Submitted!</h4>
            <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">
              Thank you! Your review has been submitted successfully and is visible below.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 justify-between">
              <span className="text-xs font-bold text-slate-500">Overall Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-0.5 hover:scale-110 transition shrink-0 cursor-pointer outline-none"
                  >
                    <Star className={`w-6 h-6 ${star <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-350'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {SUB_RATINGS.map((item) => (
                <div key={item.key} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">{item.label}</span>
                  <select
                    value={(form as any)[item.key]}
                    onChange={(e) => setForm({ ...form, [item.key]: Number(e.target.value) })}
                    className="bg-transparent border-0 font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n}★</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Review Headline</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Excellent academics and safe environment"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Detailed Review</label>
              <textarea
                rows={4}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tell us about the faculty, campus, board quality etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none resize-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Name (for display)</label>
              <input
                type="text"
                value={form.reviewerName}
                onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                placeholder="Verified Parent"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-bold text-xs h-auto px-4 py-2.5 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-blue-500"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
