import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

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

    const body = await req.json()
    const { name, dob, dateOfBirth, grade, gradeSought, gender } = body

    if (name !== undefined && name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Child name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Map fields dynamically
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (dateOfBirth !== undefined || dob !== undefined) {
      const inputDob = dateOfBirth !== undefined ? dateOfBirth : dob
      updateData.dateOfBirth = inputDob ? new Date(inputDob) : null
    }
    if (grade !== undefined || gradeSought !== undefined) {
      updateData.gradeSought = grade !== undefined ? grade : gradeSought
    }
    if (gender !== undefined) {
      if (gender === null) {
        updateData.gender = null
      } else {
        const upper = gender.toUpperCase()
        if (['MALE', 'FEMALE', 'OTHER'].includes(upper)) {
          updateData.gender = upper
        }
      }
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
