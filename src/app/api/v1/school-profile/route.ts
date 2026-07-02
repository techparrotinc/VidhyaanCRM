import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'
import { redis } from '@/lib/redis'

// GET own school profile
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
      where: { orgId: session.user.orgId },
      include: {
        locations: { where: { deletedAt: null } },
        contacts: { where: { deletedAt: null } },
        affiliations: true,
        media: { where: { deletedAt: null } },
        feeRanges: true,
        hours: true,
        facilities: true
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Fetch enabled modules
    const org = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
      include: {
        plan: {
          include: {
            planModules: true
          }
        }
      }
    })

    const explicitModules = await prisma.organizationModule.findMany({
      where: { orgId: session.user.orgId, enabled: true },
      include: { module: true }
    })

    const enabledModulesSet = new Set<string>()
    if (org?.plan?.planModules) {
      org.plan.planModules.forEach(pm => enabledModulesSet.add(pm.moduleSlug))
    }
    explicitModules.forEach(em => {
      if (em.module?.slug) enabledModulesSet.add(em.module.slug)
    })

    const enabledModules = Array.from(enabledModulesSet)

    return NextResponse.json({
      success: true,
      school,
      orgName: org?.name || school.name,
      enabledModules
    })
  } catch (error: any) {
    console.error('GET school-profile error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT update own school profile
export async function PUT(req: NextRequest) {
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

    const body = await req.json()

    // 1. Extract and update school-level fields
    const schoolFields: any = {}
    if (body.name !== undefined) schoolFields.name = body.name
    if (body.description !== undefined) schoolFields.description = body.description
    if (body.schoolType !== undefined) schoolFields.schoolType = body.schoolType
    if (body.establishedYear !== undefined) schoolFields.establishedYear = body.establishedYear ? parseInt(body.establishedYear) : null
    if (body.totalStudents !== undefined) schoolFields.totalStudents = body.totalStudents ? parseInt(body.totalStudents) : null
    if (body.totalTeachers !== undefined) schoolFields.totalTeachers = body.totalTeachers ? parseInt(body.totalTeachers) : null
    if (body.mediumOfInstruction !== undefined) schoolFields.mediumOfInstruction = body.mediumOfInstruction
    if (body.gender !== undefined) schoolFields.gender = body.gender
    if (body.gradesOffered !== undefined) schoolFields.gradesOffered = body.gradesOffered

    // Learning center specifics
    if (body.trialClassAvailable !== undefined) schoolFields.trialClassAvailable = body.trialClassAvailable
    if (body.enrollmentStatus !== undefined) schoolFields.enrollmentStatus = body.enrollmentStatus
    if (body.ageGroupMin !== undefined) schoolFields.ageGroupMin = body.ageGroupMin ? parseInt(body.ageGroupMin) : null
    if (body.ageGroupMax !== undefined) schoolFields.ageGroupMax = body.ageGroupMax ? parseInt(body.ageGroupMax) : null
    if (body.monthlyFeeMin !== undefined) schoolFields.monthlyFeeMin = body.monthlyFeeMin ? parseInt(body.monthlyFeeMin) : null
    if (body.monthlyFeeMax !== undefined) schoolFields.monthlyFeeMax = body.monthlyFeeMax ? parseInt(body.monthlyFeeMax) : null
    if (body.activityTypes !== undefined) schoolFields.activityTypes = body.activityTypes
    if (body.homeVisitAvailable !== undefined) schoolFields.homeVisitAvailable = body.homeVisitAvailable

    // Admission settings specifics
    if (body.admissionOpen !== undefined) schoolFields.admissionOpen = body.admissionOpen
    if (body.academicYear !== undefined) schoolFields.academicYear = body.academicYear
    if (body.admissionDeadline !== undefined) schoolFields.admissionDeadline = body.admissionDeadline ? new Date(body.admissionDeadline) : null
    if (body.admissionFormLink !== undefined) schoolFields.admissionFormLink = body.admissionFormLink

    // Update School record
    if (Object.keys(schoolFields).length > 0) {
      await prisma.school.update({
        where: { id: school.id },
        data: schoolFields
      })
    }

    // 2. Update Location record if present
    if (body.address1 !== undefined || body.address2 !== undefined || body.city !== undefined || body.state !== undefined || body.pincode !== undefined) {
      const existingLocation = await prisma.schoolLocation.findFirst({
        where: { schoolId: school.id, isPrimary: true, deletedAt: null }
      })

      // Combine address lines
      const parts = [body.address1, body.address2].filter((p) => p !== undefined && p !== null)
      let addressLine = undefined
      if (parts.length > 0) {
        addressLine = parts.filter(Boolean).join(', ')
      } else if (existingLocation) {
        // Keep existing if not changing address lines
        addressLine = existingLocation.addressLine
      }

      if (existingLocation) {
        await prisma.schoolLocation.update({
          where: { id: existingLocation.id },
          data: {
            addressLine: addressLine !== undefined ? addressLine : existingLocation.addressLine,
            city: body.city !== undefined ? body.city : existingLocation.city,
            state: body.state !== undefined ? body.state : existingLocation.state,
            pincode: body.pincode !== undefined ? body.pincode : existingLocation.pincode
          }
        })
      } else {
        await prisma.schoolLocation.create({
          data: {
            schoolId: school.id,
            orgId: session.user.orgId,
            addressLine: addressLine || '',
            city: body.city || '',
            state: body.state || '',
            pincode: body.pincode || '',
            isPrimary: true,
            label: 'Main Campus'
          }
        })
      }
    }

    // 3. Update Contacts if present
    if (body.phone !== undefined || body.phoneSecondary !== undefined || body.email !== undefined || body.website !== undefined || body.mapsLink !== undefined) {
      // Fetch current contacts to merge and update
      const currentContacts = await prisma.schoolContact.findMany({
        where: { schoolId: school.id }
      })

      const contactsMap = new Map(currentContacts.map(c => [c.type, c.value]))

      const phoneVal = body.phone !== undefined ? body.phone : contactsMap.get('phone')
      const phoneSecondaryVal = body.phoneSecondary !== undefined ? body.phoneSecondary : contactsMap.get('phone_secondary')
      const emailVal = body.email !== undefined ? body.email : contactsMap.get('email')
      const websiteVal = body.website !== undefined ? body.website : contactsMap.get('website')
      const mapsLinkVal = body.mapsLink !== undefined ? body.mapsLink : contactsMap.get('maps_link')

      // Sync primary phone/email to organization
      if (phoneVal || emailVal) {
        await prisma.organization.update({
          where: { id: session.user.orgId },
          data: {
            email: emailVal || undefined,
            phone: phoneVal || undefined
          }
        })
      }

      // Recreate contacts list
      await prisma.schoolContact.deleteMany({
        where: { schoolId: school.id }
      })

      const contactsToCreate = []
      if (phoneVal) {
        contactsToCreate.push({ schoolId: school.id, orgId: session.user.orgId, type: 'phone', value: phoneVal, isPrimary: true })
      }
      if (phoneSecondaryVal) {
        contactsToCreate.push({ schoolId: school.id, orgId: session.user.orgId, type: 'phone_secondary', value: phoneSecondaryVal, isPrimary: false })
      }
      if (emailVal) {
        contactsToCreate.push({ schoolId: school.id, orgId: session.user.orgId, type: 'email', value: emailVal, isPrimary: true })
      }
      if (websiteVal) {
        contactsToCreate.push({ schoolId: school.id, orgId: session.user.orgId, type: 'website', value: websiteVal, isPrimary: false })
      }
      if (mapsLinkVal) {
        contactsToCreate.push({ schoolId: school.id, orgId: session.user.orgId, type: 'maps_link', value: mapsLinkVal, isPrimary: false })
      }

      if (contactsToCreate.length > 0) {
        await prisma.schoolContact.createMany({
          data: contactsToCreate
        })
      }
    }

    // 4. Update Board Affiliations if boards or affiliationNo is present
    if (body.boards !== undefined || body.affiliationNo !== undefined) {
      const currentAffiliations = await prisma.schoolAffiliation.findMany({
        where: { schoolId: school.id }
      })

      const boardsList = body.boards !== undefined ? body.boards : currentAffiliations.map(a => a.board)
      const affNo = body.affiliationNo !== undefined ? body.affiliationNo : (currentAffiliations[0]?.affiliationNo || null)

      await prisma.schoolAffiliation.deleteMany({
        where: { schoolId: school.id }
      })

      if (boardsList && boardsList.length > 0) {
        await prisma.schoolAffiliation.createMany({
          data: boardsList.map((b: string) => ({
            schoolId: school.id,
            orgId: session.user.orgId,
            board: b,
            affiliationNo: affNo
          }))
        })
      }
    }

    // 5. Recalculate scores and return
    const updatedSchool = await recalculateAndSaveSchoolScores(school.id)

    // Invalidate organization cache
    try {
      await redis.del(`org:${session.user.orgId}`)
    } catch (err) {
      console.error('Failed to invalidate organization cache:', err)
    }

    return NextResponse.json({ success: true, school: updatedSchool })

  } catch (error: any) {
    console.error('PUT school-profile error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }
}
