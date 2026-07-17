import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { Gender } from '@prisma/client'
import { normName } from '@/lib/dedup/config'

// Generous cap — real families rarely exceed a handful of kids; this is an
// abuse/spam backstop, not a real-world limit.
const MAX_KIDS_PER_PARENT = 10

const kidInputSchema = z.object({
  name: z.string().trim().min(2, 'Child name must be at least 2 characters').max(150),
  dob: z.string().max(40).optional().nullable(),
  dateOfBirth: z.string().max(40).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  gradeSought: z.string().max(50).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other']).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    // Find Parent record by userId
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // List active kids profiles for parent
    const kids = await prisma.kidProfile.findMany({
      where: { 
        parentId: parent.id,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: kids
    })

  } catch (error: any) {
    console.error('Kids GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    // Find Parent record
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    const parsed = kidInputSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, dob, dateOfBirth, grade, gradeSought, gender } = parsed.data

    // Map fields
    const rawBirth = dateOfBirth || dob
    const birthDate = rawBirth ? new Date(rawBirth) : null
    if (birthDate && isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date of birth' },
        { status: 400 }
      )
    }
    const gradeSoughtValue = grade || gradeSought || null
    const genderValue = gender ? (gender.toUpperCase() as Gender) : null

    const existingKids = await prisma.kidProfile.findMany({
      where: { parentId: parent.id, deletedAt: null },
      select: { name: true, dateOfBirth: true }
    })

    if (existingKids.length >= MAX_KIDS_PER_PARENT) {
      return NextResponse.json(
        { success: false, error: `You can add up to ${MAX_KIDS_PER_PARENT} children per account.` },
        { status: 422 }
      )
    }

    const normalizedName = normName(name)
    const isDuplicate = existingKids.some(k =>
      normName(k.name) === normalizedName &&
      (k.dateOfBirth?.toISOString().slice(0, 10) ?? null) === (birthDate?.toISOString().slice(0, 10) ?? null)
    )
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: 'A child with this name and date of birth is already added.' },
        { status: 409 }
      )
    }

    const kid = await prisma.kidProfile.create({
      data: {
        parentId: parent.id,
        name: name.trim(),
        dateOfBirth: birthDate,
        gradeSought: gradeSoughtValue,
        gender: genderValue
      }
    })

    return NextResponse.json({
      success: true,
      data: kid
    })

  } catch (error: any) {
    console.error('Kids POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
