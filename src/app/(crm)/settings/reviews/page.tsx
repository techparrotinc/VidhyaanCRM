"use client"

// Org-side view of the school's marketplace reviews: read, flag (Vidhyaan
// decides removal), and reply to parents (thread).

import React, { useState, useEffect, useCallback } from 'react'
import { Star, Loader2, Flag, MessageSquare, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface OrgReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED'
  flagReason: string | null
  isVerifiedAdmission: boolean
  classOrCourse?: string | null
  pros: string[]
  cons: string[]
  subRatings: Record<string, number> | null
  createdAt: string
  parent: { name: string | null }
  school: { id: string; name: string; institutionType: string }
  responses: { id: string; authorType: string; body: string; createdAt: string }[]
  _count: { reports: number }
}

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  FLAGGED: 'bg-amber-50 text-amber-600 border-amber-200',
  REMOVED: 'bg-red-50 text-red-600 border-red-200',
}

export default function SettingsReviewsPage() {
  const [reviews, setReviews] = useState<OrgReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Flag modal
  const [flagTarget, setFlagTarget] = useState<OrgReview | null>(null)
  const [flagReason, setFlagReason] = useState('')
  const [flagBusy, setFlagBusy] = useState(false)

  // Reply box state (per review)
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/school-reviews')
      const json = await res.json()
      if (json.success) setReviews(json.data.reviews)
      else setError(json.error?.message || json.error || 'Failed to load reviews')
    } catch {
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submitFlag = async () => {
    if (!flagTarget || flagReason.trim().length < 3) return
    setFlagBusy(true)
    try {
      const res = await fetch(`/api/v1/school-reviews/${flagTarget.id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: flagReason.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setFlagTarget(null)
        setFlagReason('')
        load()
      }
    } finally {
      setFlagBusy(false)
    }
  }

  const submitReply = async (reviewId: string) => {
    if (replyText.trim().length === 0) return
    setReplyBusy(true)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setReplyFor(null)
        setReplyText('')
        load()
      }
    } finally {
      setReplyBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Parent Reviews</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
          Reviews parents left on your marketplace profile. You can reply publicly or flag a
          review for Vidhyaan to moderate — flagged reviews are hidden until Vidhyaan decides.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <Card className="p-6 text-sm font-medium text-red-600">{error}</Card>
      ) : reviews.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-normal text-slate-400">No reviews yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <Card key={rev.id} className="p-6 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">
                      {rev.parent.name || 'Parent'}
                    </span>
                    {rev.isVerifiedAdmission && (
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-semibold">
                        Verified Parent
                      </Badge>
                    )}
                    <Badge className={`text-[11px] font-semibold border ${STATUS_BADGE[rev.status]}`}>
                      {rev.status}
                    </Badge>
                    {rev.classOrCourse && (
                      <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 text-[11px] font-semibold">
                        {rev.classOrCourse}
                      </Badge>
                    )}
                    <span className="flex items-center gap-0.5 text-amber-600 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {rev.rating}
                    </span>
                    {rev._count.reports > 0 && (
                      <span className="text-[11px] font-semibold text-amber-600">
                        {rev._count.reports} report{rev._count.reports > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-normal text-slate-400">
                    {rev.school.name} · {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {rev.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    onClick={() => setFlagTarget(rev)}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs font-semibold h-auto px-3 py-1.5 shrink-0"
                  >
                    <Flag className="w-3.5 h-3.5 mr-1" /> Flag
                  </Button>
                )}
              </div>

              {rev.title && <h4 className="text-sm font-semibold text-slate-800">{rev.title}</h4>}
              {rev.body && <p className="text-sm font-normal leading-relaxed text-slate-500">{rev.body}</p>}

              {(rev.pros.length > 0 || rev.cons.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.pros.map((p) => (
                    <span key={`p-${p}`} className="text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">+ {p}</span>
                  ))}
                  {rev.cons.map((c) => (
                    <span key={`c-${c}`} className="text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">− {c}</span>
                  ))}
                </div>
              )}

              {rev.flagReason && (
                <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {rev.flagReason}
                </p>
              )}

              {/* response thread */}
              {rev.responses.length > 0 && (
                <div className="space-y-2 border-l-2 border-slate-100 pl-4">
                  {rev.responses.map((resp) => (
                    <div key={resp.id}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {resp.authorType === 'SCHOOL' ? rev.school.name : resp.authorType === 'PARENT' ? (rev.parent.name || 'Parent') : 'Vidhyaan'}
                        <span className="font-normal normal-case tracking-normal text-slate-400"> · {new Date(resp.createdAt).toLocaleDateString()}</span>
                      </p>
                      <p className="text-sm font-normal leading-relaxed text-slate-600">{resp.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyFor === rev.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitReply(rev.id) }}
                    placeholder="Write a public reply…"
                    maxLength={2000}
                    autoFocus
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-blue-500"
                  />
                  <Button
                    onClick={() => submitReply(rev.id)}
                    disabled={replyBusy || replyText.trim().length === 0}
                    className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-semibold h-auto px-4 py-2 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => { setReplyFor(rev.id); setReplyText('') }}
                  className="text-sm font-semibold text-[#1565D8] cursor-pointer"
                >
                  Reply
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Flag modal */}
      <Dialog open={Boolean(flagTarget)} onOpenChange={(o) => { if (!o) setFlagTarget(null) }}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Flag this review</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Flagging hides the review and sends it to Vidhyaan for a decision. You cannot
              remove reviews yourself.
            </DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Why should this review be moderated? (required)"
            maxLength={500}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none resize-none focus:border-blue-500 mt-2"
          />
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setFlagTarget(null)} className="text-xs font-semibold h-auto px-4 py-2 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={submitFlag}
              disabled={flagBusy || flagReason.trim().length < 3}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold h-auto px-5 py-2 rounded-xl"
            >
              {flagBusy ? 'Flagging…' : 'Flag Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
