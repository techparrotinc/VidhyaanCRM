import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadObject, UPLOAD_CATEGORIES, type UploadCategory } from '@/lib/storage'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'])

/** Predates the route() composer — reads x-org-id set by middleware's mobile
 *  Bearer rewrite first, falling back to the NextAuth cookie session for
 *  web (same pattern as /api/v1/notifications). */
async function resolveOrgId(req: NextRequest): Promise<string | null> {
  const headerOrgId = req.headers.get('x-org-id')
  const headerUserId = req.headers.get('x-user-id')
  if (headerOrgId && headerUserId) return headerOrgId
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user.orgId ?? session.user.id
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await resolveOrgId(req)
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      )
    }

    const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      )
    }

    const rawCategory = String(formData.get('category') ?? 'documents')
    const category = (UPLOAD_CATEGORIES as readonly string[]).includes(rawCategory)
      ? (rawCategory as UploadCategory)
      : 'documents'

    const body = Buffer.from(await file.arrayBuffer())
    const { url, key } = await uploadObject({
      orgId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      body,
      category
    })

    return NextResponse.json({
      success: true,
      url,
      key
    })
  } catch (error: any) {
    console.error('File upload route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
