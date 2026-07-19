import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { uploadObject } from '@/lib/storage'
import { invalidatePlatformConfigCache } from '@/lib/platform-config'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB — these are small signature/stamp marks
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])
const KINDS = { signatory: 'signatoryImageUrl', stamp: 'stampImageUrl' } as const

/**
 * SUPER_ADMIN upload for the images printed on platform GST invoices:
 * authorized-signatory signature and rubber stamp. Stored in the public
 * uploads space (the PDF renderer fetches them by URL) and the resulting
 * URL saved straight onto PlatformSettings. kind='' + no file clears.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const kind = formData.get('kind') as keyof typeof KINDS | null
    const file = formData.get('file') as File | null
    const clear = formData.get('clear') === 'true'

    if (!kind || !(kind in KINDS)) {
      return NextResponse.json({ error: 'kind must be signatory or stamp' }, { status: 400 })
    }
    const field = KINDS[kind]

    if (clear) {
      await prisma.platformSettings.update({ where: { id: 'default' }, data: { [field]: null } })
      invalidatePlatformConfigCache()
      return NextResponse.json({ success: true, url: null })
    }

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG or WebP images' }, { status: 400 })
    }

    const { url } = await uploadObject({
      orgId: 'platform-branding',
      fileName: file.name,
      contentType: file.type,
      body: Buffer.from(await file.arrayBuffer()),
      category: 'documents'
    })

    await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { [field]: url },
      create: { id: 'default', [field]: url }
    })
    invalidatePlatformConfigCache()

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error('Branding upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
