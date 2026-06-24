import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

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

    const body = await req.json()
    const { name, dob, dateOfBirth, grade, gradeSought, gender } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Child name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Map fields
    const birthDate = dateOfBirth || dob ? new Date(dateOfBirth || dob) : null
    const gradeSoughtValue = grade || gradeSought || null

    let genderValue: any = null
    if (gender) {
      const upper = gender.toUpperCase()
      if (['MALE', 'FEMALE', 'OTHER'].includes(upper)) {
        genderValue = upper
      }
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
