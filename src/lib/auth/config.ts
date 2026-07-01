import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        contact: { label: 'Phone or Email' },
        code: { label: 'OTP Code' },
        phone: { label: 'Phone' },
        pin: { label: 'PIN' },
        token: { label: 'Token' }
      },
      async authorize(credentials) {
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

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              orgId: user.orgId ?? ''
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

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              orgId: user.orgId ?? ''
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

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            orgId: user.orgId ?? ''
          }
        }

        return null
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
        token.phone = (user as any).phone ?? ''
        token.email = user.email ?? ''
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
