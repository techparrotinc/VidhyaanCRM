import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Simulate S3/DO Spaces upload delay (e.g. 500ms)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate simulated DO Spaces URL
    const fileExtension = file.name.split('.').pop() || 'jpg'
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
