import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'OTP',
      credentials: {
        contact: { label: 'Phone or Email' },
        code: { label: 'OTP Code' },
        purpose: { label: 'Purpose' }
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.code) return null

        const contact = credentials.contact as string
        const code = credentials.code as string

        // Find valid OTP record
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
          // Check attempt limit
          if (otpRecord.attempts >= 5) {
            await prisma.otpCode.delete({
              where: { id: otpRecord.id }
            })
            return null
          }

          // Increment attempts
          await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } }
          })

          // Verify OTP hash
          const isValid = await bcrypt.compare(code, otpRecord.codeHash)

          if (!isValid) return null

          // Mark OTP as consumed
          await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { consumedAt: new Date() }
          })
        }

        // Find user by contact
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId ?? ''
        }
      }
    })
  ],

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

export default authConfig
