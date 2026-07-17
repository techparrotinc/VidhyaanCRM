// Review eligibility gate. Fail-closed: a parent may only review an
// institution they have actually engaged with. Baseline eligibility = a
// ParentEnquiry / ParentApplication for (parent, school), or — for learning
// centres and other trial-class institutions — a TrialClassBooking matched by
// the parent's phone (bookings store phone, not parentId). The "Verified
// Parent" badge is stricter — only granted when an application has reached
// ADMITTED, i.e. the child was actually offered a seat.

import { prisma } from '@/lib/db'
import { cleanPhoneNumber } from '@/lib/utils'

export type ReviewEligibility = {
  /** May the parent submit/edit a review for this school at all? */
  eligible: boolean
  /**
   * "Verified Parent" badge (Amazon-style): the parent's child is an actual
   * enrolled student at this school (active StudentGuardianLink to a student
   * in the school's org), or a marketplace application reached ADMITTED.
   */
  verified: boolean
  reason?: string
}

// Institution-neutral: shown for schools, learning centres, academies alike.
const NOT_ELIGIBLE_REASON =
  'Submit an enquiry or book a trial class before writing a review.'

export async function getReviewEligibility(
  parentId: string,
  schoolId: string
): Promise<ReviewEligibility> {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { phone: true, email: true, phoneHistory: true },
  })
  const phoneClean =
    typeof cleanPhoneNumber(parent?.phone ?? '') === 'string'
      ? (cleanPhoneNumber(parent?.phone ?? '') as string)
      : ''
  const phoneVariants =
    phoneClean.length >= 10
      ? [phoneClean, `+91${phoneClean}`, `91${phoneClean}`]
      : []

  // Enrolled-student check needs the school's org (guardian links are CRM-side)
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { orgId: true },
  })

  const [enquiry, application, trialBooking, admittedApp, guardianLink] = await Promise.all([
    prisma.parentEnquiry.findFirst({
      where: { parentId, schoolId, deletedAt: null },
      select: { id: true },
    }),
    prisma.parentApplication.findFirst({
      where: { parentId, schoolId, deletedAt: null },
      select: { id: true },
    }),
    phoneVariants.length > 0
      ? prisma.trialClassBooking.findFirst({
          where: { schoolId, phone: { in: phoneVariants } },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.parentApplication.findFirst({
      where: { parentId, schoolId, status: 'ADMITTED', deletedAt: null },
      select: { id: true },
    }),
    school?.orgId
      ? prisma.studentGuardianLink.findFirst({
          where: {
            parentId,
            orgId: school.orgId,
            status: 'ACTIVE',
            student: { status: 'ACTIVE', deletedAt: null },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  // Contact-matched enrolment counts too — the parent portal already treats a
  // guardianPhone/guardianEmail match as a live link (linkedStudentsWhere in
  // lib/parent-portal), so the badge must agree with what the parent sees.
  let contactMatchedStudent: { id: string } | null = null
  if (!guardianLink && school?.orgId && (parent?.phone || parent?.email)) {
    const contactMatch: any[] = []
    // Matches linkedStudentsWhere's phone-history fallback — otherwise this
    // badge would disagree with what the parent portal itself shows after a
    // phone-number change.
    if (parent?.phone) contactMatch.push({ guardianPhone: { in: [parent.phone, ...(parent.phoneHistory ?? [])] } })
    if (parent?.email) contactMatch.push({ guardianEmail: parent.email })
    contactMatchedStudent = await prisma.student.findFirst({
      where: {
        orgId: school.orgId,
        status: 'ACTIVE',
        deletedAt: null,
        NOT: { guardianLinks: { some: { parentId, status: 'REVOKED' } } },
        OR: contactMatch,
      },
      select: { id: true },
    })
  }

  const verified = Boolean(guardianLink || contactMatchedStudent || admittedApp)
  // An enrolled parent is inherently eligible even without a marketplace
  // enquiry trail (they may have joined the school before Vidhyaan).
  const eligible = Boolean(enquiry || application || trialBooking || verified)
  return {
    eligible,
    verified,
    reason: eligible ? undefined : NOT_ELIGIBLE_REASON,
  }
}
