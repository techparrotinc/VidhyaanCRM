import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { cleanPhoneNumber } from '@/lib/utils'


export const GET = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ user }) => {
    const users = await prisma.user.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return ok(users)
  }
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const body = z.object({
      name: z.string().min(1),
      phone: z.preprocess(cleanPhoneNumber, z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')),
      email: z.string().email().optional().or(z.literal('')),
      role: z.enum([
        'BRANCH_ADMIN',
        'COUNSELLOR',
        'RECEPTIONIST',
        'ACCOUNTANT',
        'TEACHER'
      ])
    }).parse(await req.json())

    const email = body.email && body.email.trim() !== ''
      ? body.email
      : `${body.phone}@vidhyaan-invited.com`

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: body.phone },
          { email: email }
        ],
        deletedAt: null
      }
    })

    if (existing) {
      const field = existing.phone === body.phone ? 'phone number' : 'email'
      throw Errors.conflict(`A user with this ${field} already exists`)
    }

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: email,
        role: body.role as UserRole,
        orgId: user.orgId,
        status: 'INVITED' as UserStatus
      }
    })

    return created({
      user: newUser,
      message: 'Invitation sent to ' + body.phone + ' via WhatsApp/SMS'
    })
  }
})
