import type { NextAuthConfig } from 'next-auth'

export const configEdge: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
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
      }

      // Impersonation sessions hard-expire after 30 minutes (mirrors node config)
      if (
        (token as any).impersonationExpiresAt &&
        Date.now() > Number((token as any).impersonationExpiresAt)
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
        session.user.onboardingComplete = !!(token as any).onboardingComplete
        session.user.impersonatorId = ((token as any).impersonatorId as string | null) ?? null
        session.user.impersonationExpiresAt = ((token as any).impersonationExpiresAt as number | null) ?? null
        session.user.mustEnrol2fa = !!(token as any).mustEnrol2fa
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

export default configEdge
