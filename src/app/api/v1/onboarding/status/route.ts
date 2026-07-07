import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { calculateProfileCompletePct } from '@/lib/school-profile-helper'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ORG_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (!session.user.orgId) {
      return NextResponse.json({
        success: true,
        currentStep: 1,
        completedSteps: [],
        schoolId: null,
        schoolSlug: '',
        profileCompletePct: 0,
        isComplete: false
      })
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.orgId }
    })

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    const school = await prisma.school.findFirst({
      where: { orgId: org.id },
      include: {
        locations: { where: { deletedAt: null } },
        contacts: { where: { deletedAt: null } },
        affiliations: true,
        media: { where: { deletedAt: null } },
        feeRanges: true,
        facilities: true
      }
    })

    const settings = (org.settings as any) || {}
    const currentStep = settings.onboardingStep || 1
    const completedSteps = settings.onboardingCompletedSteps || []
    const isComplete = settings.onboardingIsComplete || false

    // Single source of truth: same checklist formula as the School Profile
    // Manager page (school-profile-helper), so the dashboard and Manage
    // Listing never disagree.
    const profileCompletePct = calculateProfileCompletePct(school)

    // Save calculated percentage back to settings and to School model
    if (profileCompletePct !== settings.profileCompletePct) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          settings: {
            ...settings,
            profileCompletePct
          }
        }
      })
      if (school) {
        await prisma.school.update({
          where: { id: school.id },
          data: {
            profileCompletion: profileCompletePct
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      currentStep,
      completedSteps,
      schoolId: school?.id || null,
      schoolSlug: school?.slug || '',
      school: school || null,
      profileCompletePct,
      isComplete,
      orgStatus: org.status,
      verificationStatus: school?.verificationStatus || 'UNCLAIMED'
    })

  } catch (error: any) {
    console.error('Onboarding status API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
