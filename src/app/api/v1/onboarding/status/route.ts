import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ORG_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (!user.orgId) {
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
      where: { id: user.orgId }
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
        feeRanges: true
      }
    })

    const settings = (org.settings as any) || {}
    const currentStep = settings.onboardingStep || 1
    const completedSteps = settings.onboardingCompletedSteps || []
    const isComplete = settings.onboardingIsComplete || false

    // Calculate dynamic profile completion percentage (100-point formula)
    let profileCompletePct = 0
    if (school) {
      // 1. Name: 10 points (always true if registered)
      profileCompletePct += 10

      // 2. Logo: 15 points (media item with caption 'logo')
      const hasLogo = school.media.some(m => m.caption === 'logo')
      if (hasLogo) profileCompletePct += 15

      // 3. Cover photo: 15 points (media item with caption 'cover')
      const hasCover = school.media.some(m => m.caption === 'cover')
      if (hasCover) profileCompletePct += 15

      // 4. Gallery: 10 points (count gallery items > 0)
      const hasGallery = school.media.some(m => m.caption === 'gallery')
      if (hasGallery) profileCompletePct += 10

      // 5. Description: 10 points
      if (school.description && school.description.trim() !== '') {
        profileCompletePct += 10
      }

      // 6. Location: 10 points
      if (school.locations.length > 0) {
        profileCompletePct += 10
      }

      // 7. Board/affiliation: 10 points
      if (school.affiliations.length > 0) {
        profileCompletePct += 10
      }

      // 8. Contact details: 10 points
      if (school.contacts.length > 0) {
        profileCompletePct += 10
      }

      // 9. Fee range: 10 points
      const hasFeeRange = school.feeRanges.length > 0 || school.monthlyFeeMin !== null
      if (hasFeeRange) {
        profileCompletePct += 10
      }
    }

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
