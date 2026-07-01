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
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.orgId = token.orgId as string
        session.user.name = token.name as string
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
