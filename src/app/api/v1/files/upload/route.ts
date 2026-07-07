import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadObject } from '@/lib/storage'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'])

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
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

    const body = Buffer.from(await file.arrayBuffer())
    const { url, key } = await uploadObject({
      orgId: session.user.orgId ?? session.user.id,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      body
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
