import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

const mediaJsonSchema = z.object({
  url: z.string().url().max(1000),
  caption: z.string().max(200).optional(),
  type: z.string().max(30).optional()
})

// GET list school media
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: { orgId: session.user.orgId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const media = await prisma.schoolMedia.findMany({
      where: { schoolId: school.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ success: true, media })
  } catch (error: any) {
    console.error('GET school-profile media error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST create/upload new media
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: { orgId: session.user.orgId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Determine content type (JSON vs FormData)
    const contentType = req.headers.get('content-type') || ''
    let url = ''
    let caption = 'gallery'
    let type = 'image'

    if (contentType.includes('application/json')) {
      const parsed = mediaJsonSchema.safeParse(await req.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }
      url = parsed.data.url
      caption = parsed.data.caption || 'gallery'
      type = parsed.data.type || 'image'
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      caption = ((formData.get('caption') as string) || 'gallery').slice(0, 200)
      type = ((formData.get('type') as string) || 'image').slice(0, 30)

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Simulate DO Spaces Upload
      await new Promise((resolve) => setTimeout(resolve, 300))
      const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'jpg'
      const uniqueId = Math.random().toString(36).substring(2, 10)
      url = `https://vidhyaan-documents.sfo3.digitaloceanspaces.com/uploads/${uniqueId}-${Date.now()}.${fileExtension}`
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
    }

    if (!url) {
      return NextResponse.json({ error: 'url or file is required' }, { status: 400 })
    }

    // Check limits for gallery photos
    if (caption === 'gallery') {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.orgId },
        include: { plan: true }
      })

      const planSlug = org?.plan?.slug || 'free'
      if (planSlug === 'free') {
        const currentCount = await prisma.schoolMedia.count({
          where: { schoolId: school.id, caption: 'gallery', deletedAt: null }
        })
        if (currentCount >= 3) {
          return NextResponse.json({ error: 'Photo limit reached. Upgrade to premium for unlimited photos.' }, { status: 400 })
        }
      }
    }

    // Determine sort order
    const maxSortMedia = await prisma.schoolMedia.findFirst({
      where: { schoolId: school.id, deletedAt: null },
      orderBy: { sortOrder: 'desc' }
    })
    const nextSortOrder = (maxSortMedia?.sortOrder ?? 0) + 1

    const newMedia = await prisma.schoolMedia.create({
      data: {
        schoolId: school.id,
        orgId: session.user.orgId,
        type,
        url,
        caption,
        sortOrder: nextSortOrder
      }
    })

    await recalculateAndSaveSchoolScores(school.id)

    return NextResponse.json({ success: true, media: newMedia })

  } catch (error: any) {
    console.error('POST school-profile media error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
