"use client"

// Vidhyaan review-moderation queue. Schools can only FLAG; the decision to
// remove or restore a review is made here (SUPER_ADMIN / OPERATIONS_ADMIN).

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Star,
  Loader2,
  Flag,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmProvider, useConfirm } from '@/components/ui/confirm-dialog'

interface AdminReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED'
  flagReason: string | null
  isVerifiedAdmission: boolean
  createdAt: string
  updatedAt: string
  parent: { name: string | null; phone: string }
  school: { id: string; name: string; slug: string }
  reports: { id: string; reason: string | null; createdAt: string }[]
}

const STATUS_TABS = ['FLAGGED', 'PUBLISHED', 'REMOVED'] as const

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  FLAGGED: 'bg-amber-50 text-amber-600 border-amber-200',
  REMOVED: 'bg-red-50 text-red-600 border-red-200',
}

export default function AdminReviewsPage() {
  // admin layout has no ConfirmProvider — mount one locally
  return (
    <ConfirmProvider>
      <AdminReviewsInner />
    </ConfirmProvider>
  )
}

function AdminReviewsInner() {
  const { data: session } = useSession()
  const confirm = useConfirm()
  const canModerate = ['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(session?.user?.role || '')

  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('FLAGGED')
  const [page, setPage] = useState(1)
  const [acting, setActing] = useState<string | null>(null)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?status=${status}&page=${page}&limit=${limit}`)
      const json = await res.json()
      if (json.success) {
        setReviews(json.data.reviews)
        setTotal(json.data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { load() }, [load])

  const decide = async (review: AdminReview, next: 'PUBLISHED' | 'REMOVED') => {
    const okConfirm = await confirm({
      title: next === 'REMOVED' ? 'Remove this review?' : 'Restore this review?',
      message:
        next === 'REMOVED'
          ? `The review by ${review.parent.name || review.parent.phone} on ${review.school.name} will be hidden from the marketplace.`
          : `The review will be published again on ${review.school.name}.`,
      confirmLabel: next === 'REMOVED' ? 'Remove' : 'Restore',
      variant: next === 'REMOVED' ? 'danger' : 'primary',
    })
    if (!okConfirm) return

    setActing(review.id)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const json = await res.json()
      if (res.ok && json.success) load()
    } finally {
      setActing(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Review Moderation</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
          Schools can flag reviews; Vidhyaan decides. Auto-flag kicks in at 3 user reports.
        </p>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setStatus(t); setPage(1) }}
            className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              status === t
                ? 'bg-[#1565D8] text-white border-[#1565D8]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400 font-medium">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No {status.toLowerCase()} reviews.
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            // SLA: flagged reviews waiting >48h need eyes now
            const waitingMs = rev.status === 'FLAGGED' ? Date.now() - new Date(rev.updatedAt).getTime() : 0
            const breachedSla = waitingMs > 48 * 60 * 60 * 1000
            return (
            <Card key={rev.id} className={`p-6 space-y-3 ${breachedSla ? 'border-red-300 bg-red-50/40' : ''}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{rev.school.name}</span>
                    <Badge className={`text-[11px] font-semibold border ${STATUS_BADGE[rev.status]}`}>
                      {rev.status}
                    </Badge>
                    {breachedSla && (
                      <Badge className="bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold">
                        Waiting {Math.floor(waitingMs / (24 * 60 * 60 * 1000))}d — decide now
                      </Badge>
                    )}
                    <span className="flex items-center gap-0.5 text-amber-600 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {rev.rating}
                    </span>
                  </div>
                  <p className="text-xs font-normal text-slate-400">
                    by {rev.parent.name || rev.parent.phone} · {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {canModerate && (
                  <div className="flex gap-2 shrink-0">
                    {rev.status !== 'REMOVED' && (
                      <Button
                        onClick={() => decide(rev, 'REMOVED')}
                        disabled={acting === rev.id}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold h-auto px-3 py-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    )}
                    {rev.status !== 'PUBLISHED' && (
                      <Button
                        onClick={() => decide(rev, 'PUBLISHED')}
                        disabled={acting === rev.id}
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs font-semibold h-auto px-3 py-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {rev.title && <h4 className="text-sm font-semibold text-slate-800">{rev.title}</h4>}
              {rev.body && <p className="text-sm font-normal leading-relaxed text-slate-500">{rev.body}</p>}

              {rev.flagReason && (
                <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5 shrink-0" /> {rev.flagReason}
                </p>
              )}

              {rev.reports.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {rev.reports.length} report{rev.reports.length > 1 ? 's' : ''}
                  </p>
                  {rev.reports.slice(0, 5).map((r) => (
                    <p key={r.id} className="text-xs font-normal text-slate-400">
                      · {r.reason || 'No reason given'} — {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              )}
            </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-auto px-3 py-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-normal text-slate-400">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-auto px-3 py-1.5 text-xs font-semibold"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
