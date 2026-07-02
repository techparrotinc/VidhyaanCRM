import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { cleanPhoneNumber } from '@/lib/utils'
import { redis } from '@/lib/redis'
import { findOrCreateUserByPhone } from '@/lib/auth/findOrCreateUserByPhone'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'


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
        status: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const usersWithRoles = await Promise.all(
      users.map(async (u) => ({
        ...u,
        role: await resolveTargetUserRole(u.id, user.orgId)
      }))
    )

    return ok(usersWithRoles)
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
      : null

    let userResult
    try {
      userResult = await findOrCreateUserByPhone({
        phone: body.phone,
        name: body.name,
        email: email,
        role: body.role as UserRole,
        orgId: user.orgId,
        status: UserStatus.INVITED
      })
    } catch (err: any) {
      if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
        throw Errors.conflict('A user with this email already exists')
      }
      throw err
    }

    const { user: newUser, isNewUser } = userResult
    if (!isNewUser) {
      throw Errors.conflict('A user with this phone number already exists')
    }

    // Invalidate counsellors cache
    await redis.del(`counsellors:${user.orgId}`)

    return created({
      user: newUser,
      message: 'Invitation sent to ' + body.phone + ' via WhatsApp/SMS'
    })
  }
})
