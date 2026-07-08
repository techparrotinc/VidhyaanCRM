import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { resolveActiveRoleAssignment, MultiRoleSelectionRequiredError } from '@/lib/auth/resolveRoleAssignment'

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        contact: { label: 'Phone or Email' },
        code: { label: 'OTP Code' },
        phone: { label: 'Phone' },
        pin: { label: 'PIN' },
        token: { label: 'Token' },
        assignmentId: { label: 'Role Assignment' },
        impersonateToken: { label: 'Impersonation Token' }
      },
      async authorize(credentials) {
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

          const isDevBypass = process.env.NODE_ENV === 'development' && code === '123456'
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
              status: 'ACTIVE'
            }
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
        }

        return null
      }
    })
  ],

  callbacks: {
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
