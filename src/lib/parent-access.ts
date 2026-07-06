import { GuardianLinkStatus, UserRole, UserStatus, type Student, type StudentGuardianLink, type Parent } from '@prisma/client'
import { prisma } from '@/lib/db'
import { findOrCreateUserByPhone } from '@/lib/auth/findOrCreateUserByPhone'
import { cleanPhoneNumber } from '@/lib/utils'

/**
 * School-initiated parent-portal provisioning: find-or-create the guardian's
 * parent account from the student's guardian phone and link it to the
 * student. The link goes ACTIVE on the parent's first OTP login — OTP is the
 * phone-ownership proof, so a mistyped guardian phone exposes nothing.
 */

export class ParentAccessError extends Error {
  constructor(message: string, public status = 422) {
    super(message)
  }
}

export type ParentAccessStatus = {
  status: GuardianLinkStatus | 'NOT_INVITED'
  parentName: string | null
  parentPhone: string | null
  invitedAt: Date | null
  activatedAt: Date | null
  lastLoginAt: Date | null
}

export async function getParentAccess(student: Student): Promise<ParentAccessStatus> {
  const link = await prisma.studentGuardianLink.findFirst({
    where: { studentId: student.id },
    orderBy: { updatedAt: 'desc' },
    include: { parent: { include: { user: { select: { lastLoginAt: true } } } } }
  })
  if (!link) {
    return {
      status: 'NOT_INVITED',
      parentName: student.guardianName,
      parentPhone: student.guardianPhone,
      invitedAt: null,
      activatedAt: null,
      lastLoginAt: null
    }
  }
  return {
    status: link.status,
    parentName: link.parent.name ?? student.guardianName,
    parentPhone: link.parent.phone,
    invitedAt: link.invitedAt,
    activatedAt: link.activatedAt,
    lastLoginAt: link.parent.user?.lastLoginAt ?? null
  }
}

/**
 * Enable (or re-invite / revive) portal access for a student's guardian.
 * Idempotent: an ACTIVE link stays active; INVITED/REVOKED are re-invited.
 */
export async function enableParentAccess(input: {
  student: Student
  orgId: string
  invitedById: string
}): Promise<{ link: StudentGuardianLink; parent: Parent; created: boolean }> {
  const { student } = input
  const phone = cleanPhoneNumber(student.guardianPhone ?? '') as string
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    throw new ParentAccessError('Student needs a valid 10-digit guardian phone number first')
  }

  // 1. User account (role PARENT, platform-level — parents belong to no org)
  const { user } = await findOrCreateUserByPhone({
    phone,
    name: student.guardianName ?? 'Parent',
    email: null, // guardian email may belong to someone else's account — let the parent add it
    role: UserRole.PARENT,
    orgId: null,
    status: UserStatus.ACTIVE
  })

  // 2. Parent record (marketplace) — same upsert-by-phone the register flow uses
  const existingParent = await prisma.parent.findUnique({ where: { phone } })
  const parent = existingParent
    ? existingParent.userId
      ? existingParent
      : await prisma.parent.update({ where: { id: existingParent.id }, data: { userId: user.id } })
    : await prisma.parent.create({
        data: {
          userId: user.id,
          phone,
          name: student.guardianName ?? null
        }
      })

  // 3. Link — unique on (studentId, parentId); revive REVOKED as a fresh invite
  const existingLink = await prisma.studentGuardianLink.findUnique({
    where: { studentId_parentId: { studentId: student.id, parentId: parent.id } }
  })

  if (existingLink?.status === GuardianLinkStatus.ACTIVE) {
    return { link: existingLink, parent, created: false }
  }

  const link = existingLink
    ? await prisma.studentGuardianLink.update({
        where: { id: existingLink.id },
        data: {
          status: GuardianLinkStatus.INVITED,
          invitedById: input.invitedById,
          invitedAt: new Date(),
          revokedAt: null
        }
      })
    : await prisma.studentGuardianLink.create({
        data: {
          orgId: input.orgId,
          studentId: student.id,
          parentId: parent.id,
          invitedById: input.invitedById
        }
      })

  // Parent already uses the portal (registered themselves earlier) — phone
  // ownership is already proven by their past OTP logins; activate now.
  if (existingParent?.userId && await hasLoggedIn(existingParent.userId)) {
    const activated = await prisma.studentGuardianLink.update({
      where: { id: link.id },
      data: { status: GuardianLinkStatus.ACTIVE, activatedAt: new Date() }
    })
    return { link: activated, parent, created: !existingLink }
  }

  return { link, parent, created: !existingLink }
}

async function hasLoggedIn(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lastLoginAt: true } })
  return !!user?.lastLoginAt
}

export async function revokeParentAccess(studentId: string): Promise<boolean> {
  const result = await prisma.studentGuardianLink.updateMany({
    where: { studentId, status: { not: GuardianLinkStatus.REVOKED } },
    data: { status: GuardianLinkStatus.REVOKED, revokedAt: new Date() }
  })
  return result.count > 0
}

/**
 * Flip a parent's INVITED links ACTIVE. Called lazily from requireParent()
 * on portal access — the parent has authenticated via OTP by then.
 */
export async function activatePendingLinks(parentId: string): Promise<void> {
  await prisma.studentGuardianLink.updateMany({
    where: { parentId, status: GuardianLinkStatus.INVITED },
    data: { status: GuardianLinkStatus.ACTIVE, activatedAt: new Date() }
  }).catch(err => console.error('[parent-access] link activation failed:', err))
}
