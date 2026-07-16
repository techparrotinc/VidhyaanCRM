import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import {
  resolveActiveRoleAssignment,
  MultiRoleSelectionRequiredError
} from '@/lib/auth/resolveRoleAssignment'
import { requiresSecondFactor, getTwoFactorState } from '@/lib/auth/twofactor'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import {
  signMobileAccessToken,
  signIntermediateToken,
  ACCESS_TOKEN_TTL_SECONDS
} from './jwt'
import { issueDeviceSession, type DeviceSessionInput } from './refresh'

/**
 * Shared tail of every mobile login path (OTP verify, workspace select, 2FA
 * pass). Resolves the workspace, gates on the second factor, then mints the
 * access + refresh pair. Mirrors the web login invariant: no full token is
 * ever issued before the second factor verifies.
 */

export interface LoginDevice {
  deviceId: string
  platform: string
  deviceName?: string | null
}

type LoginOutcome =
  | { kind: 'tokens'; response: NextResponse }
  | { kind: 'selection'; response: NextResponse }
  | { kind: 'twofactor'; response: NextResponse }

export async function completeLogin(
  userId: string,
  device: LoginDevice,
  assignmentId?: string | null,
  opts: { skipTwoFactor?: boolean } = {}
): Promise<LoginOutcome> {
  let resolved: { role: string; orgId: string | null; activeRoleAssignmentId: string }
  try {
    resolved = await resolveActiveRoleAssignment(userId, assignmentId)
  } catch (err) {
    if (err instanceof MultiRoleSelectionRequiredError) {
      const selectionToken = await signIntermediateToken('select', {
        userId,
        deviceId: device.deviceId
      })
      const workspaces = await describeWorkspaces(err.assignments)
      return {
        kind: 'selection',
        response: NextResponse.json({
          success: true,
          selectionRequired: true,
          selectionToken,
          workspaces
        })
      }
    }
    throw err
  }

  if (!opts.skipTwoFactor) {
    const needs2fa = await requiresSecondFactor(userId, resolved.orgId, resolved.role)
    if (needs2fa) {
      const challengeToken = await signIntermediateToken('2fa', {
        userId,
        deviceId: device.deviceId,
        assignmentId: resolved.activeRoleAssignmentId
      })
      // SMS-method users get their code dispatched right now — mirror of the
      // web challenge route; without this the mobile 2FA screen waits for a
      // code that never arrives.
      const state = await getTwoFactorState(userId)
      let maskedPhone: string | undefined
      if (state.method === 'SMS') {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } })
        if (u?.phone) {
          maskedPhone = `••••••${u.phone.slice(-4)}`
          const code = await createOTP(u.phone, 'SMS', 'MFA')
          await sendOTP(u.phone, code, 'SMS', 'MFA')
        }
      }
      return {
        kind: 'twofactor',
        response: NextResponse.json({
          success: true,
          twoFactorRequired: true,
          challengeToken,
          method: state.method ?? 'TOTP',
          ...(maskedPhone ? { maskedPhone } : {})
        })
      }
    }
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, name: true, phone: true }
  })
  if (!user) {
    return {
      kind: 'tokens',
      response: NextResponse.json(
        { success: false, error: 'Account is not active' },
        { status: 403 }
      )
    }
  }

  const sessionInput: DeviceSessionInput = {
    userId,
    deviceId: device.deviceId,
    platform: device.platform,
    deviceName: device.deviceName,
    assignmentId: resolved.activeRoleAssignmentId
  }
  const [accessToken, refreshToken] = await Promise.all([
    signMobileAccessToken({
      userId,
      role: resolved.role,
      orgId: resolved.orgId,
      name: user.name,
      assignmentId: resolved.activeRoleAssignmentId,
      deviceId: device.deviceId
    }),
    issueDeviceSession(sessionInput)
  ])

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  }).catch(() => {})

  return {
    kind: 'tokens',
    response: NextResponse.json({
      success: true,
      accessToken,
      accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: resolved.role,
        orgId: resolved.orgId,
        assignmentId: resolved.activeRoleAssignmentId
      }
    })
  }
}

/** Human-readable workspace list for the picker screen. */
async function describeWorkspaces(
  assignments: Array<{ id: string; role: string; orgId: string | null }>
) {
  const orgIds = assignments.map((a) => a.orgId).filter((v): v is string => !!v)
  const orgs = orgIds.length
    ? await prisma.organization.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, name: true }
      })
    : []
  const orgName = new Map(orgs.map((o) => [o.id, o.name]))
  return assignments.map((a) => ({
    assignmentId: a.id,
    role: a.role,
    orgId: a.orgId,
    orgName: a.orgId ? orgName.get(a.orgId) ?? null : null
  }))
}
