import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createOTP, generateOTP } from '@/lib/auth/otp'
import { createDefaultAdmissionStages } from '@/lib/utils/createDefaultAdmissionStages'
import bcrypt from 'bcryptjs'

const claimSchema = z.object({
  schoolId: z.string().min(1).max(50),
  verificationType: z.enum(['DOCUMENT', 'EMAIL', 'PHONE']),
  documentUrl: z.string().max(1000).optional().nullable(),
  verificationCode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable()
})

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

async function generateUniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name) || 'school-org'
  let slug = base
  let count = 1
  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug }
    })
    if (!existing) break
    slug = `${base}-${count}`
    count++
  }
  return slug
}

export async function POST(req: NextRequest) {
  try {
    const parsed = claimSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'schoolId and verificationType are required' },
        { status: 400 }
      )
    }
    const { schoolId, verificationType, documentUrl, verificationCode, phone } = parsed.data

    // 1. Find school by schoolId
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { contacts: { where: { deletedAt: null } } }
    })

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    if (school.orgId || school.verificationStatus === 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'This school is already claimed' },
        { status: 409 }
      )
    }

    // 2. Document upload verification path
    if (verificationType === 'DOCUMENT') {
      if (!documentUrl) {
        return NextResponse.json(
          { success: false, error: 'documentUrl is required for document verification' },
          { status: 400 }
        )
      }

      // Create Organization with status PENDING_VERIFICATION
      const slug = await generateUniqueOrgSlug(school.name)
      const primaryEmail = school.contacts.find(c => c.type === 'email')?.value || `pending_${school.id}@vidhyaan.com`
      const primaryPhone = school.contacts.find(c => c.type === 'phone')?.value || '0000000000'

      const org = await prisma.organization.create({
        data: {
          name: school.name,
          slug,
          institutionType: school.institutionType,
          email: primaryEmail,
          phone: primaryPhone,
          status: 'PENDING_VERIFICATION'
        }
      })

      // Create default active academic year (AY 2026-27)
      await prisma.academicYear.create({
        data: {
          orgId: org.id,
          name: 'AY 2026-27',
          type: 'ACADEMIC',
          startDate: new Date('2026-06-01T00:00:00Z'),
          endDate: new Date('2027-04-30T23:59:59Z'),
          status: 'ACTIVE'
        }
      })

      // Seed default admission pipeline stages
      await createDefaultAdmissionStages(org.id)

      // Auto-create core modules
      try {
        const isSchool = school.institutionType !== 'LEARNING_CENTER'
        const coreModuleSlugs = [
          'lead_management',
          'student_management',
          'fee_management',
          'campaign_management',
          'event_management',
          'advanced_reports',
          ...(isSchool ? ['admission_management'] : [])
        ]
        const dbModules = await prisma.module.findMany({
          where: { slug: { in: coreModuleSlugs } }
        })
        await prisma.organizationModule.createMany({
          data: dbModules.map(m => ({
            orgId: org.id,
            moduleId: m.id,
            enabled: true,
            enabledAt: new Date()
          })),
          skipDuplicates: true
        })
      } catch (err) {
        console.error('Failed to create org modules:', err)
      }

      // Link school back to the new organization and update status
      await prisma.school.update({
        where: { id: school.id },
        data: {
          orgId: org.id,
          verificationStatus: 'PENDING'
        }
      })

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          orgId: org.id,
          action: 'CREATE',
          entityType: 'SCHOOL_CLAIM',
          entityId: schoolId,
          after: {
            verificationType: 'DOCUMENT',
            documentUrl
          }
        }
      }).catch(e => console.error('Failed to write audit log:', e))

      console.log(`[OPS NOTIFICATION] School Claim Request for "${school.name}" via DOCUMENT. Document URL: ${documentUrl}`)

      return NextResponse.json({ success: true, pending: true, orgId: org.id })
    }

    // 3. Email or Phone instant verification path
    if (verificationType === 'EMAIL' || verificationType === 'PHONE') {
      if (!verificationCode) {
        return NextResponse.json(
          { success: false, error: 'verificationCode is required' },
          { status: 400 }
        )
      }

      let identifier = ''
      let purpose = 'VERIFY_EMAIL'

      if (verificationType === 'EMAIL') {
        const emailContact = school.contacts.find(c => c.type === 'email')?.value
        if (!emailContact) {
          return NextResponse.json(
            { success: false, error: 'No contact email registered for this school' },
            { status: 400 }
          )
        }
        identifier = emailContact
        purpose = 'VERIFY_EMAIL'
      } else {
        // PHONE Verification
        if (!phone) {
          return NextResponse.json(
            { success: false, error: 'Phone number is required for phone verification' },
            { status: 400 }
          )
        }
        const matchesContact = school.contacts.some(c => c.type === 'phone' && c.value.replace(/\s+/g, '') === phone.replace(/\s+/g, ''))
        if (!matchesContact) {
          return NextResponse.json(
            { success: false, error: 'Phone number does not match school records' },
            { status: 400 }
          )
        }
        identifier = phone
        purpose = 'SIGNUP' // Regularly used for signup OTP
      }

      // Verify the code against OtpCode table
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          identifier,
          consumedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!otpRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(verificationCode, otpRecord.codeHash)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 400 }
        )
      }

      // Mark OTP as consumed
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() }
      })

      // Create Organization with status ACTIVE (auto-verified)
      const slug = await generateUniqueOrgSlug(school.name)
      const primaryEmail = school.contacts.find(c => c.type === 'email')?.value || `info@school.name`
      const primaryPhone = school.contacts.find(c => c.type === 'phone')?.value || identifier

      const org = await prisma.organization.create({
        data: {
          name: school.name,
          slug,
          institutionType: school.institutionType,
          email: primaryEmail,
          phone: primaryPhone,
          status: 'ACTIVE'
        }
      })

      // Create default active academic year (AY 2026-27)
      await prisma.academicYear.create({
        data: {
          orgId: org.id,
          name: 'AY 2026-27',
          type: 'ACADEMIC',
          startDate: new Date('2026-06-01T00:00:00Z'),
          endDate: new Date('2027-04-30T23:59:59Z'),
          status: 'ACTIVE'
        }
      })

      // Seed default admission pipeline stages
      await createDefaultAdmissionStages(org.id)

      // Auto-create core modules
      try {
        const isSchool = school.institutionType !== 'LEARNING_CENTER'
        const coreModuleSlugs = [
          'lead_management',
          'student_management',
          'fee_management',
          'campaign_management',
          'event_management',
          'advanced_reports',
          ...(isSchool ? ['admission_management'] : [])
        ]
        const dbModules = await prisma.module.findMany({
          where: { slug: { in: coreModuleSlugs } }
        })
        await prisma.organizationModule.createMany({
          data: dbModules.map(m => ({
            orgId: org.id,
            moduleId: m.id,
            enabled: true,
            enabledAt: new Date()
          })),
          skipDuplicates: true
        })
      } catch (err) {
        console.error('Failed to create org modules:', err)
      }

      // Link school and update verificationStatus
      await prisma.school.update({
        where: { id: school.id },
        data: {
          orgId: org.id,
          verificationStatus: 'VERIFIED',
          isVerified: true,
          isClaimed: true,
          claimedAt: new Date()
        }
      })

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          orgId: org.id,
          action: 'UPDATE',
          entityType: 'SCHOOL_CLAIM',
          entityId: schoolId,
          after: {
            verificationType,
            identifier
          }
        }
      }).catch(e => console.error('Failed to write audit log:', e))

      return NextResponse.json({ success: true, verified: true, orgId: org.id })
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported verificationType' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Claim profile API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
