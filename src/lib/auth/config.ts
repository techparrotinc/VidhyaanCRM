import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { resolveActiveRoleAssignment, MultiRoleSelectionRequiredError } from '@/lib/auth/resolveRoleAssignment'

const authConfig: NextAuthConfig = {
  providers: [
    // Google is an identity oracle for PARENTS only — its signIn callback
    // always returns a redirect string, never a session. Every session is
    // still minted through the Credentials challenge-token path below, so
    // the 2FA gate cannot be bypassed via OAuth.
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: 'select_account' } }
          })
        ]
      : []),
    Credentials({
      name: 'Credentials',
      credentials: {
        contact: { label: 'Phone or Email' },
        code: { label: 'OTP Code' },
        phone: { label: 'Phone' },
        pin: { label: 'PIN' },
        token: { label: 'Token' },
        assignmentId: { label: 'Role Assignment' },
        impersonateToken: { label: 'Impersonation Token' },
        challengeToken: { label: '2FA Challenge Token' },
        secondFactor: { label: 'Second Factor Code' }
      },
      async authorize(credentials) {
        // -1. Challenge-token redemption — the ONLY session-minting path once
        // 2FA is in play. The primary factor was already verified by
        // /api/auth/2fa/challenge, which stashed { userId, assignmentId,
        // requires2fa } in Redis. If a second factor is required it must be
        // supplied and verified here before a JWT is issued.
        if (credentials?.challengeToken) {
          try {
            const { redis } = await import('@/lib/redis')
            const key = `mfa_challenge:${credentials.challengeToken as string}`
            const raw = await redis.get(key)
            if (!raw) return null

            const payload = JSON.parse(raw) as {
              userId: string
              assignmentId: string
              requires2fa: boolean
            }

            if (payload.requires2fa) {
              const code = (credentials.secondFactor as string | undefined)?.trim()
              if (!code) return null

              // Brute-force cap on the challenge itself.
              const attemptKey = `mfa_attempts:${credentials.challengeToken as string}`
              const attempts = await redis.incr(attemptKey)
              await redis.expire(attemptKey, 300)
              if (attempts > 5) {
                await redis.del(key)
                return null
              }

              const { verifySecondFactor } = await import('@/lib/auth/twofactor')
              const ok = await verifySecondFactor(payload.userId, code)
              if (!ok) return null
            }

            // Both factors satisfied — consume the challenge (single-use).
            await redis.del(key)

            // INVITED team members activate on this first successful login —
            // invite acceptance = first OTP login (the invited phone is the
            // trust anchor). Without this, invited users can never sign in.
            const user = await prisma.user.findUnique({
              where: { id: payload.userId }
            })
            if (!user || (user.status !== 'ACTIVE' && user.status !== 'INVITED')) return null

            const assignment = await prisma.userRoleAssignment.findFirst({
              where: { id: payload.assignmentId, userId: user.id, status: 'ACTIVE' }
            })
            if (!assignment) return null

            if (user.status === 'INVITED') {
              await prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } })
            }

            // If org policy mandates 2FA but the user is not enrolled
            // (requires2fa was false), flag a forced enrolment for middleware.
            let mustEnrol2fa = false
            if (!payload.requires2fa) {
              const { orgPolicyRequires } = await import('@/lib/auth/twofactor')
              mustEnrol2fa = await orgPolicyRequires(assignment.orgId ?? null, assignment.role)
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: assignment.role,
              orgId: assignment.orgId ?? '',
              activeRoleAssignmentId: assignment.id,
              mustEnrol2fa
            }
          } catch (e) {
            console.error('NextAuth challengeToken authorize error:', e)
            return null
          }
        }

        // 0. SUPER_ADMIN impersonation — redeems the single-use token minted
        // by /api/admin/impersonate. Session is issued as the target org user
        // with impersonatorId stamped and a hard 30-minute expiry.
        if (credentials?.impersonateToken) {
          try {
            const { redis } = await import('@/lib/redis')
            const key = `impersonate_token:${credentials.impersonateToken as string}`
            const raw = await redis.get(key)
            if (!raw) return null
            await redis.del(key) // single-use

            const payload = JSON.parse(raw) as {
              impersonatorId: string
              targetUserId: string
              targetOrgId: string
            }

            // Impersonator must still be an ACTIVE SUPER_ADMIN
            const impersonatorAssignment = await prisma.userRoleAssignment.findFirst({
              where: {
                userId: payload.impersonatorId,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
              },
              include: { user: { select: { status: true } } }
            })
            if (!impersonatorAssignment || impersonatorAssignment.user.status !== 'ACTIVE') return null

            const target = await prisma.user.findFirst({
              where: {
                id: payload.targetUserId,
                orgId: payload.targetOrgId,
                status: 'ACTIVE',
                deletedAt: null
              }
            })
            if (!target) return null

            const targetAssignment = await prisma.userRoleAssignment.findFirst({
              where: {
                userId: target.id,
                orgId: payload.targetOrgId,
                status: 'ACTIVE'
              }
            })
            if (!targetAssignment) return null

            return {
              id: target.id,
              name: target.name,
              email: target.email,
              role: targetAssignment.role,
              orgId: payload.targetOrgId,
              activeRoleAssignmentId: targetAssignment.id,
              impersonatorId: payload.impersonatorId,
              impersonationExpiresAt: Date.now() + 30 * 60 * 1000
            }
          } catch (e) {
            console.error('NextAuth impersonation authorize error:', e)
            return null
          }
        }

        // 1. Temp token authentication
        if (credentials?.token) {
          try {
            const { verifyPinToken } = await import('@/lib/auth/verifyPin')
            const result = await verifyPinToken(credentials.token as string)
            if (!result.success) return null

            const user = await prisma.user.findUnique({
              where: { id: result.userId, status: 'ACTIVE' }
            })
            if (!user) return null
            try {
              const resolved = await resolveActiveRoleAssignment(
                user.id,
                credentials?.assignmentId as string | undefined
              )
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: resolved.role,
                orgId: resolved.orgId ?? '',
                activeRoleAssignmentId: resolved.activeRoleAssignmentId
              }
            } catch (e) {
              if (e instanceof MultiRoleSelectionRequiredError) {
                console.error('MULTI_ROLE_SELECTION_REQUIRED', {
                  userId: user.id,
                  assignments: e.assignments
                })
              }
              throw e
            }
          } catch (e) {
            console.error('NextAuth token authorize verify error:', e)
            return null
          }
        }

        // 2. PIN authentication
        if (credentials?.phone && credentials?.pin) {
          try {
            const { verifyPinCredentials } = await import('@/lib/auth/verifyPin')
            const result = await verifyPinCredentials(
              credentials.phone as string,
              credentials.pin as string
            )
            if (!result.success) return null

            const user = await prisma.user.findUnique({
              where: { id: result.userId, status: 'ACTIVE' }
            })
            if (!user) return null

            // This branch predates the challenge-token flow and is unreachable
            // from the current login UI (which always goes through
            // /api/auth/2fa/challenge -> challengeToken), but NextAuth's
            // credentials provider is directly callable, so it's still a live
            // bypass: an enrolled user's 2FA was never checked here. Refuse
            // to mint a session for anyone enrolled — the only session a 2FA
            // user can get comes from the challengeToken branch above.
            const { isEnrolled } = await import('@/lib/auth/twofactor')
            if (await isEnrolled(user.id)) return null

            try {
              const resolved = await resolveActiveRoleAssignment(
                user.id,
                credentials?.assignmentId as string | undefined
              )
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: resolved.role,
                orgId: resolved.orgId ?? '',
                activeRoleAssignmentId: resolved.activeRoleAssignmentId
              }
            } catch (e) {
              if (e instanceof MultiRoleSelectionRequiredError) {
                console.error('MULTI_ROLE_SELECTION_REQUIRED', {
                  userId: user.id,
                  assignments: e.assignments
                })
              }
              throw e
            }
          } catch (e) {
            console.error('NextAuth PIN authorize verify error:', e)
            return null
          }
        }

        // 3. OTP authentication
        if (credentials?.contact && credentials?.code) {
          const contact = credentials.contact as string
          const code = credentials.code as string

          const { isTestPhoneBypass } = await import('@/lib/auth/otp')
          const isDevBypass =
            (process.env.NODE_ENV === 'development' && code === '123456') ||
            isTestPhoneBypass(contact, code)
          let otpRecord = null

          if (!isDevBypass) {
            otpRecord = await prisma.otpCode.findFirst({
              where: {
                identifier: contact,
                consumedAt: null,
                expiresAt: { gt: new Date() }
              },
              orderBy: { createdAt: 'desc' }
            })

            if (!otpRecord) return null
          }

          if (otpRecord) {
            if (otpRecord.attempts >= 5) {
              await prisma.otpCode.delete({
                where: { id: otpRecord.id }
              })
              return null
            }

            await prisma.otpCode.update({
              where: { id: otpRecord.id },
              data: { attempts: { increment: 1 } }
            })

            const isValid = await bcrypt.compare(code, otpRecord.codeHash)
            if (!isValid) return null

            await prisma.otpCode.update({
              where: { id: otpRecord.id },
              data: { consumedAt: new Date() }
            })
          }

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: contact },
                { email: contact }
              ],
              status: { in: ['ACTIVE', 'INVITED'] }
            }
          })

          if (!user) return null

          // First OTP login accepts a team invite: flip INVITED → ACTIVE.
          // The invited phone is the trust anchor (only its holder receives
          // the OTP), so this is a safe self-service activation.
          if (user.status === 'INVITED') {
            await prisma.user.update({
              where: { id: user.id },
              data: { status: 'ACTIVE' }
            })
          }

          // This branch is live (parent OTP login, school-claim phone
          // verification both call it directly, bypassing the
          // challenge-token flow) but never checked 2FA — an enrolled
          // staff user's second factor was never required if they hit this
          // path instead of /login. Parents/claim-profile accounts never
          // enrol 2FA, so this is a no-op for them and only blocks the
          // bypass for staff who are actually enrolled.
          const { isEnrolled } = await import('@/lib/auth/twofactor')
          if (await isEnrolled(user.id)) return null

          try {
            const resolved = await resolveActiveRoleAssignment(
              user.id,
              credentials?.assignmentId as string | undefined
            )
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: resolved.role,
              orgId: resolved.orgId ?? '',
              activeRoleAssignmentId: resolved.activeRoleAssignmentId
            }
          } catch (e) {
            if (e instanceof MultiRoleSelectionRequiredError) {
              console.error('MULTI_ROLE_SELECTION_REQUIRED', {
                userId: user.id,
                assignments: e.assignments
              })
            }
            throw e
          }
        }

        return null
      }
    })
  ],

  callbacks: {
    // Google branch never returns `true`: linked parents get a challenge-token
    // redirect (redeemed by /login/google via the Credentials provider), new
    // Google identities get parked in Redis and sent to complete-signup.
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true

      try {
        const sub = account.providerAccountId
        const email = (profile?.email as string | undefined) ?? null
        const emailVerified = (profile as any)?.email_verified === true
        if (!sub || !email || !emailVerified) {
          return '/login?error=google_email_unverified'
        }

        const { redis } = await import('@/lib/redis')

        const linked = await prisma.userOAuthAccount.findUnique({
          where: { provider_providerAccountId: { provider: 'google', providerAccountId: sub } },
          include: { user: { select: { id: true, status: true, deletedAt: true } } }
        })

        if (linked) {
          if (linked.user.deletedAt || linked.user.status !== 'ACTIVE') {
            return '/login?error=google_account_disabled'
          }
          // PARENT assignment only — org staff never log in via Google.
          const assignment = await prisma.userRoleAssignment.findFirst({
            where: { userId: linked.userId, role: 'PARENT', status: 'ACTIVE' }
          })
          if (!assignment) {
            return '/login?error=google_parent_only'
          }
          const challengeToken = crypto.randomBytes(32).toString('hex')
          await redis.set(
            `mfa_challenge:${challengeToken}`,
            JSON.stringify({ userId: linked.userId, assignmentId: assignment.id, requires2fa: false }),
            'EX',
            60
          )
          return `/login/google?ct=${challengeToken}`
        }

        // Unlinked Google identity → park it and collect phone + OTP once.
        const pendingToken = crypto.randomBytes(32).toString('hex')
        await redis.set(
          `google_pending:${pendingToken}`,
          JSON.stringify({ sub, email, name: (profile?.name as string | undefined) ?? '' }),
          'EX',
          600
        )
        return `/parent/complete-signup?t=${pendingToken}`
      } catch (e) {
        console.error('Google signIn callback error:', e)
        return '/login?error=google_failed'
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id
        token.role = (user as any).role
        token.orgId = (user as any).orgId
        token.name = user.name
        token.phone = (user as any).phone ?? ''
        token.email = user.email ?? ''
        token.activeRoleAssignmentId = (user as any).activeRoleAssignmentId ?? null
        token.impersonatorId = (user as any).impersonatorId ?? null
        token.impersonationExpiresAt = (user as any).impersonationExpiresAt ?? null
        token.mustEnrol2fa = (user as any).mustEnrol2fa ?? false

        // Resolve onboarding status once at login so edge middleware can gate
        // CRM routes without a per-navigation DB query / self-fetch.
        token.onboardingComplete = false
        const orgId = (user as any).orgId
        if (orgId) {
          try {
            const org = await prisma.organization.findUnique({
              where: { id: orgId },
              select: { settings: true }
            })
            token.onboardingComplete = !!((org?.settings as any)?.onboardingIsComplete)
          } catch (e) {
            console.error('jwt onboarding flag resolve error:', e)
          }
        }
      }

      // Client-triggered session update flips the flag the moment onboarding
      // finishes, without forcing a re-login.
      if (trigger === 'update' && (session as any)?.onboardingComplete === true) {
        token.onboardingComplete = true
      }

      // Client flips this the moment 2FA enrolment completes, lifting the
      // middleware force-enrol gate without a re-login.
      if (trigger === 'update' && (session as any)?.mustEnrol2fa === false) {
        token.mustEnrol2fa = false
      }

      // My Account edits (name/phone/email) — re-read from the DB so the
      // header/sidebar reflect the change without a re-login. DB is the
      // source of truth; the client only signals that something changed.
      if (trigger === 'update' && (session as any)?.profileUpdated === true && token.userId) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { name: true, phone: true, email: true }
          })
          if (fresh) {
            token.name = fresh.name
            token.phone = fresh.phone ?? ''
            token.email = fresh.email ?? ''
          }
        } catch (e) {
          console.error('jwt profile refresh error:', e)
        }
      }

      // Impersonation sessions hard-expire after 30 minutes: strip the role so
      // every role-gated route and API rejects the stale session.
      if (
        token.impersonationExpiresAt &&
        Date.now() > Number(token.impersonationExpiresAt)
      ) {
        token.role = ''
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.orgId = token.orgId as string
        session.user.name = token.name as string
        session.user.phone = token.phone as string
        session.user.email = token.email as string
        session.user.activeRoleAssignmentId = token.activeRoleAssignmentId as string | null
        session.user.onboardingComplete = !!token.onboardingComplete
        session.user.impersonatorId = (token.impersonatorId as string | null) ?? null
        session.user.impersonationExpiresAt = (token.impersonationExpiresAt as number | null) ?? null
        session.user.mustEnrol2fa = !!token.mustEnrol2fa
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    error: '/login'
  },

  session: { strategy: 'jwt' },

  secret: process.env.AUTH_SECRET
}

export default authConfig
