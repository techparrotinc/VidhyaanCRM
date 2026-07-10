"use client"

import React, { useState } from 'react'
import { Star, Send, CheckCircle2, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export type ReviewCategory = { slug: string; label: string }

export type ExistingReview = {
  rating: number
  subRatings?: Record<string, number> | null
  title?: string | null
  body?: string | null
  pros?: string[]
  cons?: string[]
  kidId?: string | null
  classOrCourse?: string | null
}

export type ReviewKid = { id: string; name: string }

type ReviewModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
  /** institution-type-adaptive sub-rating categories from the reviews registry */
  categories: ReviewCategory[]
  /** called after a successful API submit so the page can refresh reviews */
  onSubmitted: () => void
  /** parent's current review — prefills the form for editing */
  existing?: ExistingReview | null
  /** parent's children — shows a "which child?" selector when more than one */
  kids?: ReviewKid[]
}

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

/** Tap-to-rate star row. size = star px. */
function StarRow({
  value,
  onChange,
  size = 20,
}: {
  value: number
  onChange: (n: number) => void
  size?: number
}) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          className="p-0.5 cursor-pointer outline-none transition-transform hover:scale-110"
        >
          <Star
            style={{ width: size, height: size }}
            className={star <= active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  )
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
  accent,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
  accent: 'green' | 'red'
}) {
  const [draft, setDraft] = useState('')
  const chipCls = accent === 'green'
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-red-50 text-red-600 border-red-200'

  const add = () => {
    const v = draft.trim()
    if (!v || values.length >= 10 || values.includes(v)) return
    onChange([...values, v])
    setDraft('')
  }

  return (
    <div className="space-y-1.5 min-w-0">
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{label}</label>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          maxLength={60}
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Add ${label}`}
          className="px-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${chipCls}`}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReviewModal({ open, onOpenChange, schoolId, categories, onSubmitted, existing, kids = [] }: ReviewModalProps) {
  // 0 = unset. Overall is required; details are optional and only the ones
  // the parent actually taps get submitted (no misleading pre-filled 5s).
  const [rating, setRating] = useState(0)
  const [subRatings, setSubRatings] = useState<Record<string, number>>({})
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pros, setPros] = useState<string[]>([])
  const [cons, setCons] = useState<string[]>([])
  const [kidId, setKidId] = useState<string>('')
  const [classOrCourse, setClassOrCourse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [heldForModeration, setHeldForModeration] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setRating(0); setSubRatings({}); setTitle(''); setBody('')
    setPros([]); setCons([]); setKidId(''); setClassOrCourse(''); setError(null)
  }

  // Prefill from the parent's existing review when opening in edit mode
  React.useEffect(() => {
    if (!open) return
    if (existing) {
      setRating(existing.rating || 0)
      setSubRatings(existing.subRatings ?? {})
      setTitle(existing.title ?? '')
      setBody(existing.body ?? '')
      setPros(existing.pros ?? [])
      setCons(existing.cons ?? [])
      setKidId(existing.kidId ?? '')
      setClassOrCourse(existing.classOrCourse ?? '')
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Please tap the stars to give an overall rating.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId, rating, subRatings, title, body, pros, cons,
          kidId: kidId || null,
          classOrCourse: classOrCourse || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to submit review. Please try again.')
        return
      }
      setHeldForModeration(Boolean(json.data?.held))
      setSubmitted(true)
      onSubmitted()
      setTimeout(() => {
        onOpenChange(false)
        setSubmitted(false)
        setHeldForModeration(false)
        reset()
      }, 2500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[820px] bg-white p-0 rounded-2xl border border-slate-200 select-none overflow-hidden max-h-[92vh] flex flex-col">
        {submitted ? (
          <div className="py-16 px-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
              <CheckCircle2 className="w-7 h-7 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Review Submitted!</h4>
            <p className="text-sm font-normal leading-relaxed text-slate-500 max-w-xs">
              {heldForModeration
                ? 'Thank you! Your review will appear after a quick moderation check — we’ll notify you once it’s live.'
                : 'Thank you! Your review is now live and visible to other parents.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <DialogTitle className="text-lg font-black text-slate-800">Write a Review</DialogTitle>
              <DialogDescription className="text-xs text-slate-400 font-medium">
                Share your child&apos;s experience — it helps other parents make informed choices.
              </DialogDescription>
            </DialogHeader>

            {/* Body: 2 columns on desktop, stacked scroll on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] overflow-y-auto md:overflow-visible min-h-0">

              {/* LEFT — ratings */}
              <div className="p-6 space-y-5 bg-slate-50/60 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Overall Rating</label>
                  <div className="flex items-center gap-3">
                    <StarRow value={rating} onChange={(n) => { setRating(n); setError(null) }} size={28} />
                    <span className={`text-xs font-bold ${rating > 0 ? 'text-slate-600' : 'text-slate-400'}`}>
                      {rating > 0 ? RATING_WORDS[rating] : 'Tap to rate'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Rate the Details</label>
                  {categories.map((item) => (
                    <div key={item.slug} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-600 min-w-0 truncate">{item.label}</span>
                      <StarRow
                        value={subRatings[item.slug] ?? 0}
                        onChange={(n) => setSubRatings({ ...subRatings, [item.slug]: n })}
                        size={18}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — writing */}
              <div className="p-6 space-y-4">
                {
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kids.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Which Child?</label>
                        <select
                          value={kidId}
                          onChange={(e) => setKidId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">General experience</option>
                          {kids.map((k) => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Class / Course (optional)</label>
                      <input
                        type="text"
                        value={classOrCourse}
                        onChange={(e) => setClassOrCourse(e.target.value)}
                        maxLength={80}
                        placeholder="e.g. Class 2, Piano"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                }

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Review Headline</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    placeholder="Sum up your experience in one line"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Experience</label>
                  <textarea
                    rows={4}
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={4000}
                    placeholder="Tell other parents about the teaching, campus, results etc."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none resize-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TagInput label="Pros" values={pros} onChange={setPros} placeholder="e.g. Great teachers" accent="green" />
                  <TagInput label="Cons" values={cons} onChange={setCons} placeholder="e.g. Limited parking" accent="red" />
                </div>

                {error && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-white">
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
                disabled={submitting}
                className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-blue-500 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting…' : 'Submit Review'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
