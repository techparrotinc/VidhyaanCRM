import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { uploadObject } from '@/lib/storage'
import { windowLimiter } from '@/lib/ratelimit'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])

// Public file upload for a form field. Token-gated. Files are virus-scanned by
// the existing pipeline once attached as admission documents on submit.
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  const ipForLimit = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const limit = await windowLimiter(`form-upload:${token}:${ipForLimit}`, 20, 60)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many uploads, please wait a moment' }, { status: 429 })
  }

  const instance = await prisma.formInstance.findUnique({
    where: { token },
    select: { orgId: true, status: true, expiresAt: true },
  })
  if (!instance) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  if (instance.status === 'SUBMITTED') return NextResponse.json({ error: 'Form already submitted' }, { status: 409 })
  if (instance.expiresAt && instance.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Form link expired' }, { status: 410 })
  }

  const form = await req.formData()
  const file = form.get('file')
  const fieldKey = String(form.get('fieldKey') ?? '')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!fieldKey) return NextResponse.json({ error: 'Missing fieldKey' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 413 })
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url } = await uploadObject({
    orgId: instance.orgId,
    fileName: file.name,
    contentType: file.type,
    body: buffer,
    category: 'documents',
  })

  return NextResponse.json({ fieldKey, url, name: file.name, size: file.size })
}
