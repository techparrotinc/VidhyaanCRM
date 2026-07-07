import { prisma } from '@/lib/db/client'
import { calculateProfileCompletePct } from '@/lib/school-profile-helper'

export type SetupStepStatus = 'done' | 'pending' | 'skipped'

export type SetupStep = {
  key: string
  label: string
  description: string
  href: string
  optional: boolean
  status: SetupStepStatus
}

export type SetupState = {
  skippedSteps?: string[]
  bannerDismissed?: boolean
}

export type SetupSummary = {
  steps: SetupStep[]
  completedCount: number
  totalCount: number
  pct: number
  bannerDismissed: boolean
  isPaid: boolean
}

// Center-like org types get "Courses" instead of "Fee plans" and
// center wording in labels.
const CENTER_TYPES = ['LEARNING_CENTER', 'COACHING_CENTER', 'SPORTS_ACADEMY', 'SKILL_DEVELOPMENT']

const PROFILE_DONE_THRESHOLD = 70

export async function evaluateSetupSteps(orgId: string): Promise<SetupSummary> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) throw new Error('Organization not found')

  const subscription = await prisma.subscription.findFirst({
    where: { orgId, status: { in: ['ACTIVE', 'TRIALING'] } },
    orderBy: { createdAt: 'desc' },
    include: { plan: true }
  })

  const isCenter = CENTER_TYPES.includes(org.institutionType)
  const entityLabel = isCenter ? 'center' : 'school'
  const setupState: SetupState = ((org.settings as any)?.setup as SetupState) || {}
  const skipped = new Set(setupState.skippedSteps ?? [])

  const [
    school,
    activeAcademicYear,
    stageCount,
    feePlanCount,
    courseCount,
    studentCount,
    leadCount,
    gatewayConfig,
    whatsappProvider,
    smsProvider,
    whatsappWallet,
    smsWallet,
    activeUserCount
  ] = await Promise.all([
    prisma.school.findFirst({
      where: { orgId },
      include: {
        locations: { where: { deletedAt: null } },
        contacts: { where: { deletedAt: null } },
        affiliations: true,
        media: { where: { deletedAt: null } },
        feeRanges: true
      }
    }),
    prisma.academicYear.findFirst({ where: { orgId, status: 'ACTIVE' } }),
    prisma.admissionStage.count({ where: { orgId, deletedAt: null } }),
    prisma.feePlan.count({ where: { orgId, deletedAt: null } }),
    prisma.course.count({ where: { orgId, deletedAt: null } }),
    prisma.student.count({ where: { orgId, deletedAt: null } }),
    prisma.lead.count({ where: { orgId, deletedAt: null } }),
    prisma.paymentGatewayConfig.findFirst({
      where: { orgId, isCurrent: true, deletedAt: null, status: { in: ['VERIFIED', 'ACTIVE'] } }
    }),
    prisma.messagingProviderConfig.findFirst({
      where: { orgId, channel: 'WHATSAPP', status: 'VERIFIED', deletedAt: null }
    }),
    prisma.messagingProviderConfig.findFirst({
      where: { orgId, channel: 'SMS', status: 'VERIFIED', deletedAt: null }
    }),
    prisma.messageWallet.findFirst({ where: { orgId, channel: 'WHATSAPP' } }),
    prisma.messageWallet.findFirst({ where: { orgId, channel: 'SMS' } }),
    prisma.user.count({ where: { orgId, status: 'ACTIVE', deletedAt: null } })
  ])

  const profilePct = calculateProfileCompletePct(school)

  const rawSteps: Omit<SetupStep, 'status'>[] = [
    {
      key: 'profile',
      label: `Complete your ${entityLabel} profile`,
      description: 'Logo, photos, description, location and contact details shown to parents.',
      href: '/settings/school-profile',
      optional: false
    },
    {
      key: 'entity',
      label: 'Set up academic year',
      description: isCenter
        ? 'Confirm your active academic year so enrolments land in the right period.'
        : 'Confirm your active academic year so admissions land in the right period.',
      href: '/settings/academic-year',
      optional: false
    },
    {
      key: 'pipeline',
      label: isCenter ? 'Review enrolment pipeline' : 'Review admission pipeline',
      description: 'Default stages are ready — rename, reorder or recolor them to match your process.',
      href: '/settings/pipeline',
      optional: false
    },
    isCenter
      ? {
          key: 'fees',
          label: 'Set up courses & pricing',
          description: 'Add the courses you offer with their fees and billing frequency.',
          href: '/settings/courses',
          optional: false
        }
      : {
          key: 'fees',
          label: 'Create fee plans',
          description: 'Define grade-wise fee structures used for invoices and collections.',
          href: '/settings/fee-plans',
          optional: false
        },
    {
      key: 'migrate',
      label: 'Bring in your existing data',
      description: 'Import your current students and enquiries from a spreadsheet, or skip if starting fresh.',
      href: '/students',
      optional: true
    },
    {
      key: 'gateway',
      label: 'Connect payment gateway',
      description: 'Link your Razorpay account to collect fees online directly into your bank.',
      href: '/settings/payments',
      optional: false
    },
    {
      key: 'whatsapp',
      label: 'Set up WhatsApp messaging',
      description: 'Buy message credits or connect your own provider to reach parents on WhatsApp.',
      href: '/settings/addons',
      optional: true
    },
    {
      key: 'sms',
      label: 'Set up SMS messaging',
      description: 'Buy SMS credits or connect your own provider for reminders and OTPs.',
      href: '/settings/addons',
      optional: true
    },
    {
      key: 'team',
      label: 'Invite your team',
      description: 'Add counsellors and staff so everyone works from the same pipeline.',
      href: '/settings/users',
      optional: true
    }
  ]

  const doneByKey: Record<string, boolean> = {
    profile: profilePct >= PROFILE_DONE_THRESHOLD,
    entity: activeAcademicYear !== null,
    pipeline: stageCount > 0,
    fees: isCenter ? courseCount > 0 : feePlanCount > 0,
    migrate: studentCount > 0 || leadCount > 0,
    gateway: gatewayConfig !== null,
    whatsapp: whatsappProvider !== null || (whatsappWallet?.purchasedBalance ?? 0) > 0,
    sms: smsProvider !== null || (smsWallet?.purchasedBalance ?? 0) > 0,
    team: activeUserCount > 1
  }

  const steps: SetupStep[] = rawSteps.map((s) => ({
    ...s,
    status: doneByKey[s.key] ? 'done' : skipped.has(s.key) && s.optional ? 'skipped' : 'pending'
  }))

  // Skipped optional steps count as complete for the progress figure.
  const completedCount = steps.filter((s) => s.status !== 'pending').length
  const totalCount = steps.length
  const pct = Math.round((completedCount / totalCount) * 100)

  const isPaid = !!subscription && subscription.plan.slug !== 'free'

  return {
    steps,
    completedCount,
    totalCount,
    pct,
    bannerDismissed: setupState.bannerDismissed ?? false,
    isPaid
  }
}
