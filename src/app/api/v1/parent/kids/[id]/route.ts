import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const kidUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Child name must be at least 2 characters').max(150).optional(),
  dob: z.string().max(40).optional().nullable(),
  dateOfBirth: z.string().max(40).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  gradeSought: z.string().max(50).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other']).optional().nullable()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const { id } = await params

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

    // Find the kid profile
    const kid = await prisma.kidProfile.findUnique({
      where: { id }
    })

    if (!kid || kid.deletedAt !== null) {
      return NextResponse.json(
        { success: false, error: 'Child profile not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (kid.parentId !== parent.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. This child profile does not belong to you.' },
        { status: 403 }
      )
    }

    const parsed = kidUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, dob, dateOfBirth, grade, gradeSought, gender } = parsed.data

    // Map fields dynamically
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (dateOfBirth !== undefined || dob !== undefined) {
      const inputDob = dateOfBirth !== undefined ? dateOfBirth : dob
      const parsedDob = inputDob ? new Date(inputDob) : null
      if (parsedDob && isNaN(parsedDob.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date of birth' },
          { status: 400 }
        )
      }
      updateData.dateOfBirth = parsedDob
    }
    if (grade !== undefined || gradeSought !== undefined) {
      updateData.gradeSought = grade !== undefined ? grade : gradeSought
    }
    if (gender !== undefined) {
      updateData.gender = gender === null ? null : gender.toUpperCase()
    }

    const updatedKid = await prisma.kidProfile.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedKid
    })

  } catch (error: any) {
    console.error('Kids PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const { id } = await params

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

    // Find the kid profile
    const kid = await prisma.kidProfile.findUnique({
      where: { id }
    })

    if (!kid || kid.deletedAt !== null) {
      return NextResponse.json(
        { success: false, error: 'Child profile not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (kid.parentId !== parent.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. This child profile does not belong to you.' },
        { status: 403 }
      )
    }

    // Soft delete child profile
    await prisma.kidProfile.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Child profile deleted successfully'
    })

  } catch (error: any) {
    console.error('Kids DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
