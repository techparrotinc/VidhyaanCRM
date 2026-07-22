import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revokeAssignment } from '@/lib/auth/roleRevocation'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 1. Find Parent record
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        guardianLinks: {
          where: { status: { not: 'REVOKED' } },
          select: { id: true }
        }
      }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Org-invited parents (linked to a school/LC student) can't self-delete —
    // the school owns that relationship; only marketplace-only parents can.
    if (parent.guardianLinks.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Your account is linked to a school. Please contact the school to remove access.' },
        { status: 403 }
      )
    }

    const activeRoleAssignmentId = session.user.activeRoleAssignmentId

    let remainingActiveCount = 0
    if (activeRoleAssignmentId) {
      remainingActiveCount = await prisma.userRoleAssignment.count({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
          id: { not: activeRoleAssignmentId }
        }
      })
    }

    const shouldAnonymizeUser = !activeRoleAssignmentId || remainingActiveCount === 0

    // 2. Perform deactivation and anonymization in a transaction
    await prisma.$transaction(async (tx) => {
      const now = new Date()
      const anonymizedId = parent.id.slice(-6)

      const operations = []

      // B. Soft Delete Parent
      operations.push(
        tx.parent.update({
          where: { id: parent.id },
          data: {
            deletedAt: now,
            name: 'Anonymized Parent',
            phone: `deleted_${anonymizedId}_${parent.id}`,
            email: `deleted_parent_${parent.id}@deleted.vidhyaan.com`,
            city: null
          }
        })
      )

      // C. Remove all Bookmarks
      operations.push(
        tx.parentBookmark.deleteMany({
          where: { parentId: parent.id }
        })
      )

      // D. Anonymize Enquiries (DPDP right to erasure: keep aggregate stats but remove PII)
      operations.push(
        tx.parentEnquiry.updateMany({
          where: { parentId: parent.id },
          data: {
            kidName: null,
            message: 'Anonymized for privacy (DPDP)'
          }
        })
      )

      // E. Anonymize Applications (DPDP right to erasure: keep aggregate stats but remove PII)
      operations.push(
        tx.parentApplication.updateMany({
          where: { parentId: parent.id },
          data: {
            kidName: 'Anonymized Child',
            // status remains so schools can see history, but no personal details are left
          }
        })
      )

      if (activeRoleAssignmentId) {
        operations.push(
          tx.userRoleAssignment.update({
            where: { id: activeRoleAssignmentId },
            data: { status: 'REVOKED' }
          })
        )
      }

      if (shouldAnonymizeUser) {
        operations.push(
          tx.user.update({
            where: { id: userId },
            data: {
              deletedAt: now,
              status: 'DEACTIVATED',
              // Anonymize user details to comply with DPDP
              name: 'Deleted Parent User',
              phone: `deleted_${anonymizedId}_${userId}`,
              email: `deleted_user_${userId}@deleted.vidhyaan.com`
            }
          })
        )
      }

      for (const op of operations) {
        await op
      }

      // Note: Data is flagged with deletedAt = now() for complete hard purge after 30 days via a background cleanup cron job
    })

    if (activeRoleAssignmentId) {
      await revokeAssignment(session.user.id, activeRoleAssignmentId)
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted. Data will be fully removed within 30 days.',
      identityRemoved: shouldAnonymizeUser
    })

  } catch (error: any) {
    console.error('Account deletion API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}
