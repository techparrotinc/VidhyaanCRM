// Parent reviews: list published reviews for a school (public) and submit a
// review (verified parents only — must have enquired/applied to the school).
// One review per parent per school; resubmission updates the existing review.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent } from '@/lib/reviews/parent-auth'
import { getReviewEligibility } from '@/lib/reviews/eligibility'
import { sanitizeSubRatings } from '@/lib/reviews/categories'
import { recomputeSchoolRating } from '@/lib/reviews/aggregate'
import { notifyOrgAdmins } from '@/lib/services/notifications'
import { checkReviewContent, checkReviewRisk } from '@/lib/reviews/guardrails'
import { alertModeratorsReviewFlagged } from '@/lib/reviews/moderation-alert'
import { windowLimiter } from '@/lib/ratelimit'
import { canWriteNewReview } from '@/lib/reviews/window'

const TAG = z.string().trim().min(1).max(60)

const createSchema = z.object({
  schoolId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  subRatings: z.record(z.string(), z.number()).optional(),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().max(4000).optional(),
  pros: z.array(TAG).max(10).default([]),
  cons: z.array(TAG).max(10).default([]),
  /** Which child the review is about (parent's KidProfile id). */
  kidId: z.string().optional().nullable(),
  /** Class/course context shown on the card ("Class 2", "Piano"). */
  classOrCourse: z.string().trim().max(80).optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.nextUrl.searchParams.get('schoolId')
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId required' }, { status: 400 })
    }
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize')) || 10))

    const where = { schoolId, status: 'PUBLISHED' as const, deletedAt: null }
    const [total, reviews] = await Promise.all([
      prisma.schoolReview.count({ where }),
      prisma.schoolReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          parent: { select: { name: true } },
          responses: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true, authorType: true, body: true, createdAt: true },
          },
        },
      }),
    ])

    return NextResponse.json({ success: true, data: { reviews, total, page, pageSize } })
  } catch (error) {
    console.error('GET /api/v1/reviews error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireParent()
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    const parent = authResult.parent

    // Platform-wide rate limit: 5 review submissions per parent per day
    // (stops seed-spam; legitimate parents never hit this)
    const rl = await windowLimiter(`review-submit:${parent.id}`, 5, 24 * 60 * 60)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many review submissions today. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 }
      )
    }
    const input = parsed.data

    const school = await prisma.school.findFirst({
      where: { id: input.schoolId, deletedAt: null },
      select: { id: true, orgId: true, institutionType: true, name: true },
    })
    if (!school) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 })
    }

    // Eligibility gate — fail-closed
    const eligibility = await getReviewEligibility(parent.id, school.id)
    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, error: eligibility.reason || 'Not eligible to review this school' },
        { status: 403 }
      )
    }

    // ── Guardrails (hybrid moderation) ──
    const fullText = [input.title, input.body, ...input.pros, ...input.cons]
      .filter(Boolean)
      .join(' ')
    const contentVerdict = checkReviewContent(fullText)
    if (contentVerdict.action === 'BLOCK') {
      return NextResponse.json(
        { success: false, error: contentVerdict.message },
        { status: 422 }
      )
    }
    const riskVerdict =
      contentVerdict.action === 'HOLD'
        ? contentVerdict
        : checkReviewRisk({
            rating: input.rating,
            parentCreatedAt: parent.createdAt,
            isVerifiedAdmission: eligibility.verified,
          })
    const held = riskVerdict.action === 'HOLD'

    // Per-kid dedup: one review per parent+school+kid. A kid must belong to
    // the submitting parent (fail-closed against forged kidIds).
    const kidId = input.kidId || null
    if (kidId) {
      const kid = await prisma.kidProfile.findFirst({
        where: { id: kidId, parentId: parent.id, deletedAt: null },
        select: { id: true },
      })
      if (!kid) {
        return NextResponse.json(
          { success: false, error: 'Invalid child selection' },
          { status: 422 }
        )
      }
    }

    // Latest review in this parent+school+kid bucket. Within 6 months →
    // resubmission edits it in place; older → a NEW review is created and the
    // old one stays visible (dated) so readers see the trajectory.
    const latest = await prisma.schoolReview.findFirst({
      where: { parentId: parent.id, schoolId: school.id, kidId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, createdAt: true },
    })
    const existing = latest && !canWriteNewReview(latest.createdAt) ? latest : null

    // Status resolution:
    // - guardrail hold → FLAGGED (hidden, moderator alerted)
    // - editing a FLAGGED/REMOVED review must NOT resurrect it to PUBLISHED —
    //   moderation status sticks until Vidhyaan decides
    let status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED' = 'PUBLISHED'
    let flagReason: string | null = null
    if (held) {
      status = 'FLAGGED'
      flagReason = (riskVerdict as { action: 'HOLD'; reason: string }).reason
    } else if (existing && existing.status !== 'PUBLISHED') {
      status = existing.status as 'FLAGGED' | 'REMOVED'
      flagReason = 'Edited while under moderation — pending Vidhyaan decision'
    }

    const data = {
      rating: input.rating,
      subRatings: sanitizeSubRatings(school.institutionType, input.subRatings),
      title: input.title || null,
      body: input.body || null,
      pros: input.pros,
      cons: input.cons,
      isVerifiedAdmission: eligibility.verified,
      kidId,
      classOrCourse: input.classOrCourse || null,
      status,
      flagReason,
    }

    const review = existing
      ? await prisma.schoolReview.update({ where: { id: existing.id }, data })
      : await prisma.schoolReview.create({
          data: { ...data, schoolId: school.id, orgId: school.orgId, parentId: parent.id },
        })

    await recomputeSchoolRating(school.id)

    if (status === 'PUBLISHED') {
      // Tell the school (claimed profiles only) — a 1★ review is as actionable
      // as a hot lead. Fire-and-forget: notification failure must not fail POST.
      if (school.orgId) {
        const stars = '★'.repeat(input.rating) + '☆'.repeat(5 - input.rating)
        notifyOrgAdmins(school.orgId, {
          type: 'REVIEW_RECEIVED',
          title: existing
            ? `A parent updated their review (${stars})`
            : `New parent review (${stars})`,
          body: `${parent.name || 'A parent'} rated you ${input.rating}/5${input.title ? ` — “${input.title}”` : ''}. You can reply or flag it from Settings → Parent Reviews.`,
          data: { href: '/settings/reviews', reviewId: review.id, rating: input.rating },
        }).catch(() => {})
      }
    } else if (held) {
      // Held for moderation — alert the queue, keep the school out of it
      alertModeratorsReviewFlagged({
        reviewId: review.id,
        schoolName: school.name,
        flaggedBy: flagReason || 'automated guardrails',
      }).catch(() => {})
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          review,
          updated: Boolean(existing),
          held,
          message: held
            ? 'Thanks! Your review has been submitted and will appear after a quick moderation check.'
            : undefined,
        },
      },
      { status: existing ? 200 : 201 }
    )
  } catch (error) {
    console.error('POST /api/v1/reviews error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
