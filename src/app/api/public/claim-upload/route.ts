import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { uploadObject } from '@/lib/storage'
import { windowLimiter } from '@/lib/ratelimit'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB (matches the claim UI copy)
const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png'])

// Public verification-document upload for the claim-profile flow (pre-auth).
// The claim itself is registered separately via /api/auth/school/claim with
// the URL returned here.
export async function POST(req: NextRequest) {
  const ipForLimit = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const limit = await windowLimiter(`claim-upload:${ipForLimit}`, 10, 60)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many uploads, please wait a moment' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }
  const file = form.get('file')
  const schoolId = String(form.get('schoolId') ?? '')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!schoolId) return NextResponse.json({ error: 'Missing schoolId' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 5 MB' }, { status: 413 })
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Only PDF, JPG or PNG allowed' }, { status: 415 })

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, orgId: true, verificationStatus: true },
  })
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })
  if (school.verificationStatus === 'VERIFIED') {
    return NextResponse.json({ error: 'School is already claimed and verified' }, { status: 409 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  // Unclaimed schools have no org yet — file under a claims/<schoolId> space
  const { url } = await uploadObject({
    orgId: school.orgId ?? `claims/${school.id}`,
    fileName: file.name,
    contentType: file.type,
    body: buffer,
    category: 'documents',
  })

  return NextResponse.json({ url, name: file.name, size: file.size })
}
