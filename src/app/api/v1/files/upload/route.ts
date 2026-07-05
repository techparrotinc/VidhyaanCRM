import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

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

    // Simulate S3/DO Spaces upload delay (e.g. 500ms)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const uniqueId = Math.random().toString(36).substring(2, 10)
    const simulatedUrl = `https://vidhyaan-documents.sfo3.digitaloceanspaces.com/uploads/${uniqueId}-${Date.now()}.${fileExtension}`

    return NextResponse.json({
      success: true,
      url: simulatedUrl
    })
  } catch (error: any) {
    console.error('File upload route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
