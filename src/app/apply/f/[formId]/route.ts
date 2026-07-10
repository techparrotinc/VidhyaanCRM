import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { newFormToken } from '@/lib/forms/urls'
import { windowLimiter } from '@/lib/ratelimit'

// Reusable public share-link for a published form. Instance tokens are
// single-submission, so a copyable link can't point at one token — instead
// this mints a fresh STANDALONE instance per visitor and redirects to it.
export async function GET(req: NextRequest, ctx: { params: Promise<{ formId: string }> }) {
  const { formId } = await ctx.params

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const limit = await windowLimiter(`form-share:${ip}`, 20, 60)
  if (!limit.success) {
    return new NextResponse('Too many requests — please try again in a minute.', { status: 429 })
  }

  const form = await prisma.form.findFirst({
    where: { id: formId, status: 'PUBLISHED', deletedAt: null },
    select: { id: true, orgId: true, purpose: true },
  })
  if (!form) {
    return new NextResponse('This form is no longer available.', { status: 404 })
  }

  const token = newFormToken()
  await prisma.formInstance.create({
    data: {
      orgId: form.orgId,
      formId: form.id,
      targetType: 'STANDALONE',
      token,
      channel: 'LINK',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  return NextResponse.redirect(new URL(`/apply/${token}`, req.url), 302)
}
