'use client'

// Parent portal — My Reviews: every review this parent wrote, across schools
// and learning centres, with status, school replies, and edit/delete actions.

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Star,
  Loader2,
  MessageSquare,
  Trash2,
  Pencil,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MyReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED'
  isVerifiedAdmission: boolean
  classOrCourse?: string | null
  pros: string[]
  cons: string[]
  createdAt: string
  school: { id: string; name: string; slug: string; institutionType: string }
  responses: { id: string; authorType: string; body: string; createdAt: string }[]
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Live', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  FLAGGED: { label: 'Under Moderation', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  REMOVED: { label: 'Removed', cls: 'bg-red-50 text-red-600 border-red-200' },
}

function profileHref(school: MyReview['school']) {
  const path = school.institutionType === 'LEARNING_CENTER' ? 'learning-centers' : 'schools'
  return `/${path}/${school.slug}#reviews`
}

export default function ParentMyReviewsPage() {
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/parent/reviews')
      const json = await res.json()
      if (json.success) setReviews(json.data.reviews)
      else setError(json.error || 'Failed to load your reviews')
    } catch {
      setError('Failed to load your reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/v1/reviews/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id))
      }
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Reviews</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
          Reviews you have written for schools and learning centres. Schools may reply here.
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
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-600">No reviews yet</p>
          <p className="text-xs font-normal text-slate-400 mt-1 max-w-sm mx-auto">
            After you enquire or book a trial with a school, you can share your experience
            from its profile page.
          </p>
          <Link href="/schools">
            <Button className="mt-4 bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-semibold h-auto px-5 py-2.5 rounded-xl">
              Explore Schools
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const meta = STATUS_META[rev.status] ?? STATUS_META.PUBLISHED
            return (
              <Card key={rev.id} className="p-6 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={profileHref(rev.school)}
                        className="text-sm font-semibold text-slate-800 hover:text-[#1565D8] truncate"
                      >
                        {rev.school.name}
                      </Link>
                      <Badge className={`text-[11px] font-semibold border ${meta.cls}`}>{meta.label}</Badge>
                      {rev.isVerifiedAdmission && (
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </Badge>
                      )}
                      {rev.classOrCourse && (
                        <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 text-[11px] font-semibold">
                          {rev.classOrCourse}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-normal text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-600 text-xs font-black shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rev.rating}</span>
                  </div>
                </div>

                {rev.title && <h4 className="text-sm font-semibold text-slate-800">{rev.title}</h4>}
                {rev.body && (
                  <p className="text-sm font-normal leading-relaxed text-slate-500">{rev.body}</p>
                )}

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

                {rev.responses.length > 0 && (
                  <div className="space-y-2 border-l-2 border-slate-100 pl-4">
                    {rev.responses.map((resp) => (
                      <div key={resp.id}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {resp.authorType === 'SCHOOL' ? rev.school.name : resp.authorType === 'PARENT' ? 'You' : 'Vidhyaan'}
                          <span className="font-normal normal-case tracking-normal text-slate-400"> · {new Date(resp.createdAt).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm font-normal leading-relaxed text-slate-600">{resp.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <Link
                    href={profileHref(rev.school)}
                    className="text-xs font-semibold text-[#1565D8] flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit / Reply on profile
                  </Link>
                  <Link
                    href={profileHref(rev.school)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </Link>
                  {confirmDeleteId === rev.id ? (
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-slate-500">Delete this review?</span>
                      <button
                        onClick={() => handleDelete(rev.id)}
                        disabled={deletingId === rev.id}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        {deletingId === rev.id ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-slate-400 cursor-pointer">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(rev.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
